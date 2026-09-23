import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { Text, View } from "react-native";
import type { GradeScales } from "@sendtally/api-client";
import {
  CLIMB_TYPES,
  areaClimbGradeLabel,
  climbFieldsOf,
  climbTypeLabel,
  useDuplicateCheck,
  withType,
  type AreaClimb,
  type ClimbFormValues,
} from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { gradeOptions, scaleLabel, scaleOptionsFor } from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Sheet } from "../../components/Sheet";
import { useApi } from "../../lib/api";
import { AreaSearchField, type PickedArea } from "./AreaSearchField";
import { AreaSubmit } from "./AreaSubmit";
import { Candidates } from "./Candidates";
import { fieldInput, fieldLabel } from "./styles";

export type AddClimbSheetProps = {
  /** What the row already says; null keeps the sheet closed. */
  initial: ClimbFormValues | null;
  /** The session's crag; without one the sheet asks for it. */
  area: PickedArea | null;
  scales: GradeScales;
  onCreated: (climb: AreaClimb, area: PickedArea) => void;
  onClose: () => void;
};

function Chips({ children }: { children: React.ReactNode }): React.ReactElement {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{children}</View>;
}

function ClimbForm({
  initial,
  area: sessionArea,
  scales,
  onCreated,
}: Omit<AddClimbSheetProps, "initial" | "onClose"> & {
  initial: ClimbFormValues;
}): React.ReactElement {
  const api = useApi();
  const [values, setValues] = React.useState(initial);
  const [chosenArea, setChosenArea] = React.useState<PickedArea | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const area = sessionArea ?? chosenArea;
  const check = useDuplicateCheck<AreaClimb, AreaClimb | null>(
    `${values.name.trim().toLowerCase()}|${area?.id ?? ""}`
  );

  async function submit(): Promise<void> {
    const fields = climbFieldsOf(values);
    if (fields.name === "") return setError(t("areas.nameRequired"));
    if (area === null) return setError(t("areas.pickCrag"));
    const at = area;
    setBusy(true);
    setError(null);
    try {
      const created = await check.save({
        similar: async () => (await api.similarAreaClimbs(at.id, fields.name)).candidates,
        create: async (confirmedNew) =>
          (await api.createAreaClimb({ ...fields, areaId: at.id, confirmedNew })).climb,
      });
      setBusy(false);
      if (created !== null) onCreated(created, at);
    } catch {
      setBusy(false);
      setError(t("common.somethingWentWrongTryAgain"));
    }
  }

  return (
    <View style={{ gap: 14, paddingHorizontal: 18, paddingTop: 2, paddingBottom: 4 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.gunmetal }}>
        {sessionArea === null
          ? t("areas.addAClimb")
          : t("areas.addClimbIn", { name: sessionArea.name })}
      </Text>
      <View style={{ gap: 7 }}>
        <Text style={fieldLabel}>{t("areas.name")}</Text>
        <BottomSheetTextInput
          accessibilityLabel={t("areas.name")}
          autoCorrect={false}
          autoComplete="off"
          value={values.name}
          placeholder={t("areas.climbNamePlaceholder")}
          placeholderTextColor={colors.textFaint}
          onChangeText={(name) => setValues({ ...values, name })}
          style={fieldInput}
        />
      </View>
      {sessionArea === null && (
        <View style={{ gap: 7 }}>
          <Text style={fieldLabel}>{t("areas.crag")}</Text>
          <AreaSearchField
            inSheet
            crags
            value={chosenArea}
            label={t("areas.crag")}
            placeholder={t("areas.searchCrags")}
            onPick={setChosenArea}
          />
        </View>
      )}
      <View style={{ gap: 7 }}>
        <Text style={fieldLabel}>{t("areas.type")}</Text>
        <Chips>
          {CLIMB_TYPES.map((type) => (
            <Chip
              key={type}
              label={climbTypeLabel(type)}
              active={values.type === type}
              onPress={() => setValues(withType(values, type, scales))}
            />
          ))}
        </Chips>
      </View>
      <View style={{ gap: 7 }}>
        <Text style={fieldLabel}>{t("areas.gradeScale")}</Text>
        <Chips>
          {scaleOptionsFor(values.type === "boulder" ? "boulder" : "route").map((scale) => (
            <Chip
              key={scale}
              label={scaleLabel(scale)}
              active={values.gradeScale === scale}
              onPress={() => setValues({ ...values, gradeScale: scale, grade: "" })}
            />
          ))}
        </Chips>
      </View>
      <View style={{ gap: 7 }}>
        <Text style={fieldLabel}>{`${t("areas.grade")} ${t("common.optional")}`}</Text>
        {/* Chips, not a SelectRow: dismissing a third stacked sheet closes all three. */}
        <Chips>
          {["", ...gradeOptions(values.gradeScale)].map((grade) => (
            <Chip
              key={grade === "" ? "-" : grade}
              label={grade === "" ? t("areas.gradeUnknown") : grade}
              active={grade === values.grade}
              onPress={() => setValues({ ...values, grade })}
            />
          ))}
        </Chips>
      </View>
      {check.confirming && (
        <Candidates
          candidates={check.candidates.map((c) => ({
            id: c.id,
            name: c.name,
            meta: areaClimbGradeLabel(c),
          }))}
          onPick={(id) => {
            const same = check.candidates.find((c) => c.id === id);
            if (same !== undefined && area !== null) onCreated(same, area);
          }}
        />
      )}
      <AreaSubmit
        label={check.confirming ? t("areas.yesItsNew") : t("common.save")}
        busy={busy}
        error={error}
        onPress={() => void submit()}
      />
    </View>
  );
}

/**
 * Adds the climb the name search did not find, prefilled from the row. It opens over the climb
 * editor (sheets stack), so saving lands back on the row with the new climb linked.
 */
export function AddClimbSheet({
  initial,
  onClose,
  ...props
}: AddClimbSheetProps): React.ReactElement {
  const [shown, setShown] = React.useState(initial);
  if (initial !== null && initial !== shown) setShown(initial);
  return (
    <Sheet visible={initial !== null} onClose={onClose} closeLabel={t("areas.closeAddSheet")}>
      {shown !== null && <ClimbForm {...props} initial={shown} />}
    </Sheet>
  );
}

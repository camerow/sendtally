import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  changeFrom,
  type Dose,
  type Item,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import {
  fieldLabel,
  fieldValue,
  stepped,
  weekFields,
  withField,
  type DoseField,
} from "@sendtally/features/training";
import { press } from "../../../lib/press";
import { Label } from "../components/Label";
import { Stepper } from "../components/Stepper";
import { type } from "../type";

export type RungEditorProps = {
  kind: WorkoutKind;
  item: Item;
  change: Partial<Dose>;
  unit: WeightUnit;
  /** The week's whole change to this item, counted from the item as written. */
  onChange: (change: Partial<Dose>) => void;
};

const UNIT: Partial<Record<DoseField, string>> = {
  onS: "s",
  offS: "s",
  setRestS: "s",
  edgeMm: "mm",
};

/** One item of one week: a stepper for each field it changes, and more fields to change. */
export function RungEditor({
  kind,
  item,
  change,
  unit,
  onChange,
}: RungEditorProps): React.ReactElement {
  const written = item.dose;
  const [shown, setShown] = React.useState(() =>
    weekFields(kind, written).filter((f) => change[f] !== undefined)
  );
  const dose: Dose = { ...written, ...change };
  const set = (target: Dose): void => onChange(changeFrom(written, target));
  const more = weekFields(kind, written).filter((f) => !shown.includes(f));
  const suffix = (f: DoseField): string => (f === "weightKg" ? unit : (UNIT[f] ?? ""));

  return (
    <View style={{ gap: 12 }}>
      {shown.map((f) => {
        const label = fieldLabel(kind, written, f);
        return (
          <View key={f} style={{ gap: 6 }}>
            <Label small color={colors.textSecondary}>
              {suffix(f) === "" ? label : `${label} · ${suffix(f)}`}
            </Label>
            <Stepper
              value={formatNumber(fieldValue(dose, f, unit))}
              onCommit={(text) => {
                const next = withField(dose, f, Number(text.replace(",", ".")), unit);
                if (next !== null) set(next);
              }}
              onStep={(direction) => set(stepped(dose, f, direction, unit))}
              label={label}
              decreaseLabel={t("hang.decrease", { field: label })}
              increaseLabel={t("hang.increase", { field: label })}
              surface="card"
              deferred
            />
          </View>
        );
      })}
      {more.length > 0 && (
        <View style={{ gap: 6 }}>
          <Label small color={colors.textSecondary}>
            {t("plan.alsoChange")}
          </Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {more.map((f) => (
              <Pressable
                key={f}
                onPress={() => setShown([...shown, f])}
                accessibilityRole="button"
                style={press({
                  height: 36,
                  paddingHorizontal: 12,
                  borderRadius: 18,
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.lineOnLightStrong,
                  backgroundColor: colors.white,
                })}
              >
                <Text style={[type.bodyBold, { fontSize: 13, color: colors.gunmetal }]}>
                  {`+ ${fieldLabel(kind, written, f)}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

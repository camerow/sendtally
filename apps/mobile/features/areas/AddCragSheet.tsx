import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  areaFieldsOf,
  mappedAreas,
  pickedInside,
  roundedSpot,
  useAreaSearch,
  useDuplicateCheck,
  type Area,
  type AreaFormValues,
  type AreaSummary,
  type LatLon,
} from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Sheet } from "../../components/Sheet";
import { useApi } from "../../lib/api";
import { AreaSearchField, type PickedArea } from "./AreaSearchField";
import { AreaSubmit } from "./AreaSubmit";
import { Candidates } from "./Candidates";
import { LocationMap } from "./LocationMap";
import { actionText, fieldInput, fieldLabel } from "./styles";
import { press } from "../../lib/press";

export type AddCragSheetProps = {
  /** The typed name to start from; null keeps the sheet closed. */
  name: string | null;
  /** Where the crag field already was, so "where is it" starts answered. */
  parent: PickedArea | null;
  onCreated: (area: PickedArea) => void;
  onClose: () => void;
};

async function deviceSpot(): Promise<LatLon | null> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return null;
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return roundedSpot({ lat: coords.latitude, lon: coords.longitude });
}

function CragForm({
  initialName,
  initialParent,
  onCreated,
}: {
  initialName: string;
  initialParent: PickedArea | null;
  onCreated: (area: PickedArea) => void;
}): React.ReactElement {
  const api = useApi();
  const [values, setValues] = React.useState<AreaFormValues>({
    name: initialName,
    description: "",
    lat: "",
    lon: "",
  });
  const [parent, setParent] = React.useState<PickedArea | null>(initialParent);
  const [busy, setBusy] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const needsCoordinates = parent === null || parent.region === true;
  const typed = areaFieldsOf(values);
  const spot =
    typeof typed?.lat === "number" && typeof typed.lon === "number"
      ? { lat: typed.lat, lon: typed.lon }
      : null;
  const around = mappedAreas(useAreaSearch(api, "", spot, { crags: true, enabled: spot !== null }));

  function place(at: LatLon): void {
    setValues((v) => ({ ...v, lat: String(at.lat), lon: String(at.lon) }));
  }

  async function locate(): Promise<void> {
    setLocating(true);
    setError(null);
    const at = await deviceSpot().catch(() => null);
    setLocating(false);
    if (at === null) setError(t("areas.locationFailed"));
    else place(at);
  }
  const check = useDuplicateCheck<AreaSummary, Area | null>(
    `${values.name.trim().toLowerCase()}|${parent?.id ?? ""}|${values.lat}|${values.lon}`
  );

  async function submit(): Promise<void> {
    const fields = areaFieldsOf(values);
    if (fields === null) return setError(t("areas.coordinatesInvalid"));
    if (fields.name === "") return setError(t("areas.nameRequired"));
    if (parent === null) return setError(t("areas.pickWhere"));
    if (needsCoordinates && fields.lat === null) return setError(t("areas.coordinatesRequired"));
    const parentId = parent.id;
    const at =
      fields.lat === null || fields.lon === null ? {} : { lat: fields.lat, lon: fields.lon };
    setBusy(true);
    setError(null);
    try {
      const created = await check.save({
        similar: async () =>
          (await api.similarAreas({ parentId, name: fields.name, ...at })).candidates,
        create: async (confirmedNew) =>
          (await api.createArea({ ...fields, parentId, confirmedNew })).area,
      });
      setBusy(false);
      if (created !== null) onCreated(pickedInside(parent, created));
    } catch {
      setBusy(false);
      setError(t("common.somethingWentWrongTryAgain"));
    }
  }

  const coordinate = (field: "lat" | "lon", label: string): React.ReactElement => (
    <BottomSheetTextInput
      accessibilityLabel={label}
      value={values[field]}
      placeholder={label}
      placeholderTextColor={colors.textFaint}
      keyboardType="numbers-and-punctuation"
      onChangeText={(v) => setValues({ ...values, [field]: v })}
      style={{ ...fieldInput, flex: 1 }}
    />
  );

  return (
    <View style={{ gap: 14, paddingHorizontal: 18, paddingTop: 2, paddingBottom: 4 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.gunmetal }}>
        {parent === null || parent.region === true
          ? t("areas.addACrag")
          : t("areas.addAreaIn", { name: parent.name })}
      </Text>
      <View style={{ gap: 7 }}>
        <Text style={fieldLabel}>{t("areas.name")}</Text>
        <BottomSheetTextInput
          accessibilityLabel={t("areas.name")}
          autoCorrect={false}
          autoComplete="off"
          value={values.name}
          placeholder={t("areas.areaNamePlaceholder")}
          placeholderTextColor={colors.textFaint}
          onChangeText={(name) => setValues({ ...values, name })}
          style={fieldInput}
        />
      </View>
      <View style={{ gap: 7 }}>
        <Text style={fieldLabel}>{t("areas.whereIsIt")}</Text>
        <AreaSearchField
          inSheet
          value={parent}
          label={t("areas.whereIsIt")}
          placeholder={t("areas.searchRegions")}
          onPick={setParent}
        />
      </View>
      <View style={{ gap: 7 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={fieldLabel}>
            {needsCoordinates
              ? t("areas.location")
              : `${t("areas.location")} ${t("common.optional")}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={locating}
            hitSlop={10}
            onPress={() => void locate()}
            style={press({})}
          >
            <Text style={actionText}>
              {locating ? t("areas.locating") : t("areas.useMyLocation")}
            </Text>
          </Pressable>
        </View>
        <LocationMap
          value={spot}
          near={null}
          around={around}
          onMove={(at) => place(roundedSpot(at))}
        />
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 19,
            color: colors.textSecondary,
          }}
        >
          {t("areas.mapHint")}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {coordinate("lat", t("areas.latitude"))}
          {coordinate("lon", t("areas.longitude"))}
        </View>
      </View>
      {check.confirming && (
        <Candidates
          candidates={check.candidates.map((a) => ({
            id: a.id,
            name: a.name,
            meta: a.status === "pending" ? t("areas.pending") : "",
          }))}
          onPick={(id) => {
            const same = check.candidates.find((a) => a.id === id);
            if (same !== undefined) onCreated(pickedInside(parent, same));
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

/** Adds the crag the log form's search did not find, asking which region or area it is in. */
export function AddCragSheet({
  name,
  parent,
  onCreated,
  onClose,
}: AddCragSheetProps): React.ReactElement {
  const [shown, setShown] = React.useState(name);
  if (name !== null && name !== shown) setShown(name);
  return (
    <Sheet visible={name !== null} onClose={onClose} closeLabel={t("areas.closeAddSheet")}>
      {shown !== null && (
        <CragForm initialName={shown} initialParent={parent} onCreated={onCreated} />
      )}
    </Sheet>
  );
}

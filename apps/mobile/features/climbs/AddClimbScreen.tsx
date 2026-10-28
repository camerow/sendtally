import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  useAreaClimbSearch,
  useAreaSearch,
  withAreaClimb,
  withTypedName,
} from "@sendtally/features/areas";
import {
  areaChoice,
  climbSuggestions,
  findClimb,
  isNewClimb,
  placeOf,
  typicalGradeIndex,
  useClimbs,
} from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import {
  disciplineLabel,
  disciplineOf,
  draftGrade,
  gradeOptions,
  localDate,
  logClimbOnDay,
  newClimb,
  withClimbDiscipline,
  withPickedClimb,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { DateTimeField } from "../../components/DateTimeField";
import { GradeChips } from "../../components/GradeChips";
import { Icon } from "../../components/Icon";
import { Segmented } from "../../components/Segmented";
import { Switch } from "../../components/Switch";
import { TextInput } from "../../components/TextInput";
import { useApi } from "../../lib/api";
import { press } from "../../lib/press";
import { ResultFields } from "../log-session/ResultFields";
import { SuggestField } from "./SuggestField";

type Area = { id: string; name: string };

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

const row = {
  minHeight: 56,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  borderBottomWidth: 1,
  borderBottomColor: colors.lineOnLightSoft,
} as const;

/** Mine by the id it was picked as, else by its name. */
const knownOf = (climbs: readonly ClimbSummary[], climb: ClimbDraft): ClimbSummary | undefined =>
  climbs.find((c) => c.id === climb.userClimbId) ?? findClimb([...climbs], climb.name);

/**
 * One screen for a climb: its name and area autocomplete, and anything not found is created.
 * It saves into that day's session at the area, or starts one there.
 */
export function AddClimbScreen(): React.ReactElement {
  const api = useApi();
  const { climbId } = useLocalSearchParams<{ climbId?: string }>();
  const { state } = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const mine = state.status === "ready" ? state.data.climbs : [];
  const [climb, setClimb] = React.useState<ClimbDraft>(() => ({
    ...newClimb("climb-1", scales.boulder),
    grade: "",
  }));
  const [project, setProject] = React.useState(true);
  const [date, setDate] = React.useState(localDate(new Date()));
  const [areaText, setAreaText] = React.useState("");
  const [area, setArea] = React.useState<Area | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const areaClimbs = useAreaClimbSearch(api, climb.name, area?.id ?? null, true).found;
  const areas = useAreaSearch(api, area === null ? areaText : "", null, {
    crags: true,
    enabled: area === null,
  });
  const choice = areaChoice(areaText, area, areas);
  const suggestions = climbSuggestions(climb.name, mine, areaClimbs, area?.name ?? null);

  const pickMine = (c: ClimbSummary): void => {
    const picked = withPickedClimb({ ...climb, scale: c.grade?.scale ?? scales[c.discipline] }, c);
    setClimb(c.area_climb_id === null ? picked : { ...picked, climbId: c.area_climb_id });
    if (area === null && c.area !== null) {
      setArea(c.area);
      setAreaText(c.area.name);
    }
  };

  const [preset, setPreset] = React.useState(false);
  if (!preset && state.status !== "loading") {
    setPreset(true);
    const known = mine.find((c) => c.id === climbId);
    if (known !== undefined) pickMine(known);
  }

  const discipline = disciplineOf(climb.scale);
  const ladder = gradeOptions(climb.scale);
  const at = ladder.indexOf(climb.grade);
  const valid = climb.name.trim() !== "" && draftGrade(climb.grade, climb.scale) !== undefined;
  const sent = climb.kind === "send";

  const submit = (): void => {
    if (!valid || saving) return;
    setSaving(true);
    setFailed(false);
    const { key: _key, ...draft } = climb;
    placeOf(api, choice)
      .then((place) =>
        logClimbOnDay(
          api,
          { ...draft, name: draft.name.trim(), project: sent ? undefined : project },
          date,
          [],
          { area: place }
        )
      )
      .then(
        () => router.back(),
        () => {
          setSaving(false);
          setFailed(true);
        }
      );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={press({
            minWidth: 72,
            height: 44,
            justifyContent: "center",
            paddingHorizontal: 8,
          })}
        >
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.textSecondary }}>
            {t("common.cancel")}
          </Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
        >
          {t("climbs.addClimb")}
        </Text>
        <View style={{ minWidth: 72 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 16, padding: 18, paddingTop: 12, paddingBottom: 32 }}
        >
          {failed && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
              {t("climbs.saveFailed")}
            </Text>
          )}
          <SuggestField
            label={t("climbs.climb")}
            value={climb.name}
            placeholder={t("climbs.namePlaceholder")}
            suggestions={suggestions}
            isNew={isNewClimb(climb.name, mine, areaClimbs)}
            onChangeText={(name) => setClimb(withTypedName(climb, name))}
            onPick={(key) => {
              const s = suggestions.find((x) => x.key === key);
              if (s?.kind === "areas") setClimb(withAreaClimb(climb, s.climb));
              if (s?.kind === "mine") pickMine(s.climb);
            }}
          />
          <SuggestField
            label={t("areas.area")}
            value={areaText}
            placeholder={t("areas.searchAreas")}
            suggestions={areas.map((a) => ({ key: a.id, name: a.name, meta: "" }))}
            isNew={choice?.kind === "new"}
            hint={choice?.kind === "new" ? t("climbs.newArea") : null}
            onChangeText={(text) => {
              setAreaText(text);
              setArea(null);
            }}
            onPick={(id) => {
              const picked = areas.find((a) => a.id === id);
              if (picked === undefined) return;
              setArea({ id: picked.id, name: picked.name });
              setAreaText(picked.name);
            }}
          />
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={label}>{t("common.grade")}</Text>
              <View style={{ width: 180 }}>
                <Segmented
                  soft
                  label={t("climbs.discipline")}
                  segments={(["boulder", "route"] as const).map((d) => ({
                    key: d,
                    label: disciplineLabel(d),
                    on: d === discipline,
                    onPress: () => setClimb(withClimbDiscipline(climb, d, scales)),
                  }))}
                />
              </View>
            </View>
            <View style={{ marginHorizontal: -18 }}>
              <GradeChips
                light
                chips={ladder.map((g) => ({ key: g, label: g }))}
                active={at < 0 ? null : climb.grade}
                startIndex={at < 0 ? typicalGradeIndex(mine, climb.scale) : at}
                onPick={(grade) => setClimb({ ...climb, grade })}
              />
            </View>
          </View>
          <ResultFields climb={climb} known={knownOf(mine, climb) ?? null} onChange={setClimb} />
          {!sent && (
            <View style={row}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Icon name="star" color={colors.gunmetal} size={16} strokeWidth={1.8} />
                  <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.gunmetal }}>
                    {t("common.project")}
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary }}
                >
                  {t("climbs.projectHint")}
                </Text>
              </View>
              <Switch
                checked={project}
                onChange={setProject}
                disabled={false}
                label={t("common.project")}
              />
            </View>
          )}
          <View style={row}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.gunmetal }}>
              {t("logSession.date")}
            </Text>
            <View style={{ width: 150 }}>
              <DateTimeField
                mode="date"
                value={date}
                max={localDate(new Date())}
                label={t("logSession.date")}
                onChange={setDate}
              />
            </View>
          </View>
          <TextInput
            value={climb.note}
            onChangeText={(note) => setClimb({ ...climb, note })}
            multiline
            placeholder={t("climbs.notesPlaceholder")}
            placeholderTextColor={colors.textFaint}
            accessibilityLabel={t("common.notes")}
            style={{
              minHeight: 76,
              paddingHorizontal: 14,
              paddingTop: 14,
              borderRadius: radius.control + 2,
              backgroundColor: colors.surfaceSoft,
              fontFamily: fonts.sans,
              fontSize: 15,
              color: colors.gunmetal,
              textAlignVertical: "top",
            }}
          />
        </ScrollView>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.lineOnLight,
            paddingHorizontal: 18,
            paddingTop: 12,
            paddingBottom: 10,
            backgroundColor: colors.white,
          }}
        >
          <Pressable
            onPress={submit}
            disabled={!valid || saving}
            accessibilityRole="button"
            accessibilityState={{ disabled: !valid || saving }}
            style={press({
              minHeight: 50,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.control,
              backgroundColor: colors.azureInk,
              opacity: !valid || saving ? 0.45 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
              {saving ? t("common.saving") : t("common.save")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

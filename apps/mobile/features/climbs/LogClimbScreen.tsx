import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClimbSummary } from "@sendtally/api-client";
import { withAreaClimb, type AreaClimb } from "@sendtally/features/areas";
import { climbProgressLabel, logClimb, useClimbs } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import {
  draftGrade,
  localDate,
  newClimb,
  withPickedClimb,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { useApi } from "../../lib/api";
import { press } from "../../lib/press";
import type { PickedArea } from "../areas/AreaSearchField";
import { ClimbDetailsStep, type ClimbLogDetails } from "./ClimbDetailsStep";
import { PickClimbStep } from "./PickClimbStep";

type Picked = { climb: ClimbDraft; progress: string | null; editable: boolean };

const KEY = "climb-1";

/** The crag a log opens at: the climb's own, or wherever the user last logged a named climb. */
function defaultCrag(
  climbs: readonly ClimbSummary[],
  preset: ClimbSummary | undefined
): PickedArea | null {
  if (preset !== undefined) return preset.area;
  return (
    [...climbs].sort((a, b) => b.last_at.localeCompare(a.last_at)).find((c) => c.area !== null)
      ?.area ?? null
  );
}

/** Log a climb outside: pick it, then how it went. It saves into that day's session at the crag. */
export function LogClimbScreen(): React.ReactElement {
  const api = useApi();
  const { climbId } = useLocalSearchParams<{ climbId?: string }>();
  const { state } = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const climbs = state.status === "ready" ? state.data.climbs : [];
  const [area, setArea] = React.useState<PickedArea | null>(null);
  const [changingArea, setChangingArea] = React.useState(false);
  const [picked, setPicked] = React.useState<Picked | null>(null);
  const [details, setDetails] = React.useState<ClimbLogDetails>({
    sent: false,
    tries: 1,
    date: localDate(new Date()),
    note: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const pickMine = (c: ClimbSummary): Picked => {
    const base = newClimb(KEY, c.grade?.scale ?? scales[c.discipline]);
    const climb = withPickedClimb(base, c);
    return {
      climb: c.area_climb_id === null ? climb : { ...climb, climbId: c.area_climb_id },
      progress: climbProgressLabel(c),
      editable: false,
    };
  };

  const [ready, setReady] = React.useState(false);
  if (!ready && state.status !== "loading") {
    setReady(true);
    const preset = climbs.find((c) => c.id === climbId);
    setArea(defaultCrag(climbs, preset));
    if (preset !== undefined) setPicked(pickMine(preset));
  }

  const pickAreas = (c: AreaClimb): void =>
    setPicked({
      climb: withAreaClimb(newClimb(KEY, c.type === "boulder" ? scales.boulder : scales.route), c),
      progress: null,
      editable: false,
    });

  const pickNew = (name: string): void =>
    setPicked({
      climb: { ...newClimb(KEY, scales.boulder), name },
      progress: null,
      editable: true,
    });

  const changeCrag = (): void => {
    setPicked(null);
    setChangingArea(true);
  };

  const climb = picked?.climb ?? null;
  const valid =
    climb !== null &&
    climb.name.trim() !== "" &&
    draftGrade(climb.grade, climb.scale) !== undefined;

  const save = (): void => {
    if (climb === null || !valid) return;
    setSaving(true);
    setFailed(false);
    logClimb(
      api,
      {
        name: climb.name,
        scale: climb.scale,
        grade: climb.grade,
        ...details,
        areaClimbId: climb.climbId,
        userClimbId: climb.userClimbId,
      },
      details.date,
      { area }
    ).then(
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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
        }}
      >
        <Pressable
          onPress={() =>
            picked !== null && climbId === undefined ? setPicked(null) : router.back()
          }
          accessibilityRole="button"
          style={press({ width: 80, height: 44, justifyContent: "center", paddingHorizontal: 10 })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.azureInk }}>
            {picked !== null && climbId === undefined ? t("common.back") : t("common.cancel")}
          </Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.gunmetal }}
        >
          {t("climbs.logAClimb")}
        </Text>
        <View style={{ width: 80 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 18, paddingTop: 14, paddingBottom: 32 }}
        >
          {picked === null ? (
            <PickClimbStep
              area={area}
              climbs={climbs}
              changingArea={changingArea}
              onChangeArea={() => setChangingArea(true)}
              onArea={(next) => {
                setArea(next);
                if (next !== null) setChangingArea(false);
              }}
              onMine={(c) => setPicked(pickMine(c))}
              onAreas={pickAreas}
              onNew={pickNew}
            />
          ) : (
            <ClimbDetailsStep
              crag={area?.name ?? null}
              climb={picked.climb}
              progress={picked.progress}
              editable={picked.editable}
              prefs={scales}
              details={details}
              onChangeCrag={changeCrag}
              onClimb={(c) => setPicked({ ...picked, climb: c })}
              onDetails={setDetails}
            />
          )}
        </ScrollView>
        {picked !== null && (
          <View
            style={{
              gap: 8,
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 10,
              borderTopWidth: 1,
              borderTopColor: colors.lineOnLight,
            }}
          >
            {failed && (
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
                {t("climbs.saveFailed")}
              </Text>
            )}
            <Pressable
              onPress={save}
              disabled={!valid || saving}
              accessibilityRole="button"
              accessibilityState={{ disabled: !valid || saving }}
              style={press({
                height: 54,
                borderRadius: radius.card,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.gunmetal,
                opacity: !valid || saving ? 0.5 : 1,
              })}
            >
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.white }}>
                {saving ? t("common.saving") : t("common.save")}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

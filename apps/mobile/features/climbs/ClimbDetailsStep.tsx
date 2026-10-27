import React from "react";
import { Text, View } from "react-native";
import {
  disciplineLabel,
  disciplineOf,
  localDate,
  withClimbDiscipline,
  type ClimbDraft,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { DateTimeField } from "../../components/DateTimeField";
import { Segmented } from "../../components/Segmented";
import { TextInput } from "../../components/TextInput";
import { GradePicker } from "../log-session/GradePicker";
import { CragBox } from "./CragBox";
import { TriesStepper } from "./TriesStepper";

export type ClimbLogDetails = { sent: boolean; tries: number; date: string; note: string };

export type ClimbDetailsStepProps = {
  crag: string | null;
  climb: ClimbDraft;
  /** Days and tries so far, for one of your climbs. */
  progress: string | null;
  /** A climb not listed is named and graded here. */
  editable: boolean;
  prefs: GradePrefs;
  details: ClimbLogDetails;
  onChangeCrag: () => void;
  onClimb: (climb: ClimbDraft) => void;
  onDetails: (details: ClimbLogDetails) => void;
};

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

const box = {
  minHeight: 50,
  paddingHorizontal: 14,
  borderRadius: radius.control + 2,
  backgroundColor: colors.surfaceSoft,
  fontFamily: fonts.sans,
  fontSize: 15,
  color: colors.gunmetal,
} as const;

/** Sent or not yet, tries today, the day and a note. */
export function ClimbDetailsStep({
  crag,
  climb,
  progress,
  editable,
  prefs,
  details,
  onChangeCrag,
  onClimb,
  onDetails,
}: ClimbDetailsStepProps): React.ReactElement {
  const set = (patch: Partial<ClimbLogDetails>): void => onDetails({ ...details, ...patch });
  const discipline = disciplineOf(climb.scale);
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <Text style={label}>{t("climbs.where")}</Text>
        <CragBox name={crag} onChange={onChangeCrag} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={label}>{t("climbs.climb")}</Text>
        {editable ? (
          <View style={{ gap: 10 }}>
            <TextInput
              value={climb.name}
              onChangeText={(name) => onClimb({ ...climb, name })}
              autoCorrect={false}
              placeholder={t("climbs.namePlaceholder")}
              placeholderTextColor={colors.textFaint}
              accessibilityLabel={t("climbs.name")}
              style={box}
            />
            <Segmented
              soft
              label={t("climbs.discipline")}
              segments={(["boulder", "route"] as const).map((d) => ({
                key: d,
                label: disciplineLabel(d),
                on: d === discipline,
                onPress: () => onClimb(withClimbDiscipline(climb, d, prefs)),
              }))}
            />
            <GradePicker climb={climb} onChange={onClimb} />
          </View>
        ) : (
          <View
            style={{
              ...box,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              backgroundColor: colors.white,
              borderWidth: 1.5,
              borderColor: colors.gunmetal,
            }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "baseline", gap: 10 }}>
              <Text
                style={{ fontFamily: fonts.monoSemiBold, fontSize: 15, color: colors.gunmetal }}
              >
                {climb.grade}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 15,
                  color: colors.gunmetal,
                }}
              >
                {climb.name}
              </Text>
            </View>
            {progress !== null && (
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary }}>
                {progress}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={label}>{t("climbs.result")}</Text>
        <Segmented
          soft
          label={t("climbs.result")}
          segments={[
            {
              key: "sent",
              label: t("common.sent"),
              on: details.sent,
              onPress: () => set({ sent: true }),
            },
            {
              key: "not",
              label: t("sessionDetail.notYet"),
              on: !details.sent,
              onPress: () => set({ sent: false }),
            },
          ]}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={label}>{t("climbs.triesToday")}</Text>
        <TriesStepper value={details.tries} onChange={(tries) => set({ tries })} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={label}>{t("logSession.date")}</Text>
        <DateTimeField
          mode="date"
          value={details.date}
          max={localDate(new Date())}
          label={t("logSession.date")}
          onChange={(date) => set({ date })}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={label}>{t("climbs.note")}</Text>
        <TextInput
          value={details.note}
          onChangeText={(note) => set({ note })}
          multiline
          placeholder={t("climbs.notePlaceholder")}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={t("climbs.note")}
          style={{ ...box, minHeight: 76, paddingTop: 14, textAlignVertical: "top" }}
        />
      </View>
    </View>
  );
}

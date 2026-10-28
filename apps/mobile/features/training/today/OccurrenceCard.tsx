import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import type { Occurrence } from "@sendtally/features/training";
import { workoutMinutes, type LibraryWorkout } from "@sendtally/features/workouts";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { StartButton } from "../library-detail/StartButton";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK } from "./kindLook";
import { occurrenceMeta, occurrenceTag } from "./occurrenceText";

export type OccurrenceCardProps = { occurrence: Occurrence; workout: LibraryWorkout };

/** A workout due today: the card opens the workout, Start runs what it prescribes. */
export function OccurrenceCard({ occurrence, workout }: OccurrenceCardProps): React.ReactElement {
  const { model } = useHangData();
  const o = occurrence;
  const link = { membershipId: o.membership.id, week: o.week };
  const minutes = workoutMinutes(workout);
  return (
    <View
      style={{
        gap: 12,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: colors.white,
      }}
    >
      <Pressable
        onPress={() => router.push({ pathname: "/workout/[id]", params: { id: workout.id } })}
        accessibilityRole="button"
        style={({ pressed }) => ({ gap: 12, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <DayMark kind={workout.kind} filled />
          <Label color={KIND_LOOK[workout.kind].ink} style={{ flex: 1 }}>
            {t("hang.upToday", { kind: occurrenceTag(kindLabel(workout.kind), o) })}
          </Label>
          {minutes !== null && <Label color={colors.textSecondary}>{durationLabel(minutes)}</Label>}
        </View>
        <View style={{ gap: 4 }}>
          <Title size={28}>{workout.name}</Title>
          <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
            {occurrenceMeta(o, model.settings.units)}
          </Text>
        </View>
      </Pressable>
      <StartButton
        workout={workout}
        date={o.date}
        planned={{ link, items: o.items, session: o.session }}
        height={50}
      />
    </View>
  );
}

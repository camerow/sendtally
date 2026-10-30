import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { occurrenceLink, type Occurrence } from "@sendtally/features/training";
import { workoutMinutes, type LibraryWorkout } from "@sendtally/features/workouts";
import { liveRunHref, useLiveRun } from "../../live-session/liveRun";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LogItButton } from "../library-detail/LogItButton";
import { StartButton } from "../library-detail/StartButton";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK } from "./kindLook";
import { occurrenceMeta, occurrenceTag } from "./occurrenceText";

export type OccurrenceCardProps = { occurrence: Occurrence; workout: LibraryWorkout };

/** A workout due today: the card opens the workout, Start runs what it prescribes, Resume goes back to it running. */
export function OccurrenceCard({ occurrence, workout }: OccurrenceCardProps): React.ReactElement {
  const { model } = useHangData();
  const o = occurrence;
  const planned = { link: occurrenceLink(o), items: o.items, session: o.session };
  const minutes = workoutMinutes(workout);
  const run = useLiveRun();
  const running = run?.workoutId === workout.id ? run : null;
  const tag = occurrenceTag(kindLabel(workout.kind), o);
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
            {running === null
              ? t("hang.upToday", { kind: tag })
              : `${t("tally.inProgress")} · ${tag}`}
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
      {running === null ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StartButton
            workout={workout}
            date={o.date}
            planned={planned}
            height={50}
            style={{ flex: 1 }}
          />
          <LogItButton
            workout={workout}
            date={o.date}
            label={t("workouts.logIt")}
            planned={planned}
            height={50}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Button
          label={t("hang.resume")}
          onPress={() => router.push(liveRunHref(running))}
          variant="primary"
          height={50}
          icon="play"
        />
      )}
    </View>
  );
}

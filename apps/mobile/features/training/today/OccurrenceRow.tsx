import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { occurrenceLink, type Occurrence } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { StartButton } from "../library-detail/StartButton";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK } from "./kindLook";
import { occurrenceMeta, occurrenceTag } from "./occurrenceText";

export type OccurrenceRowProps = { occurrence: Occurrence; workout: LibraryWorkout };

/** A planned workout on a day that is not today's to start: done, missed with Start to catch it up, or still to come. */
export function OccurrenceRow({ occurrence, workout }: OccurrenceRowProps): React.ReactElement {
  const { model } = useHangData();
  const { status } = occurrence;
  const done = status === "done";
  const tag =
    status === "done"
      ? t("plan.done")
      : status === "missed"
        ? t("hang.missed")
        : occurrenceTag(t("hang.planned"), occurrence);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: done ? 1 : 1.5,
        borderStyle: done ? "solid" : "dashed",
        borderColor: done ? colors.lineOnLightStrong : "rgba(64,63,76,0.24)",
        overflow: "hidden",
      }}
    >
      <DayMark kind={workout.kind} filled={done} />
      <Pressable
        onPress={() => router.push({ pathname: "/workout/[id]", params: { id: workout.id } })}
        accessibilityRole="button"
        style={pressRow({ flex: 1, gap: 3, paddingVertical: 10 })}
      >
        <Label
          small
          color={status === "missed" ? colors.watermelonInk : KIND_LOOK[workout.kind].ink}
        >
          {tag}
        </Label>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {workout.name}
        </Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {occurrenceMeta(occurrence, model.settings.units)}
        </Text>
      </Pressable>
      {status === "missed" && (
        <StartButton
          workout={workout}
          date={occurrence.date}
          planned={{
            link: occurrenceLink(occurrence),
            items: occurrence.items,
            session: occurrence.session,
          }}
          height={36}
        />
      )}
    </View>
  );
}

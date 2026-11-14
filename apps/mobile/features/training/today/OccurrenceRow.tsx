import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  type Occurrence,
  KIND_LOOK,
  occurrenceMeta,
  occurrenceTag,
  plannedItems,
} from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { pressRow } from "../../../lib/press";
import { DetailMenu } from "../components/DetailMenu";
import { Label } from "../components/Label";
import { dayRows } from "../plan-days/dayRows";
import { useDayChanges } from "../plan-days/useDayChanges";
import { useHangData } from "../data/HangDataContext";
import { logLibraryWorkout } from "../library-detail/startLibraryWorkout";
import { type } from "../type";
import { openOccurrence } from "./openOccurrence";
import { DayMark } from "./DayMark";
import { KindCircle } from "./KindCircle";

export type OccurrenceRowProps = { occurrence: Occurrence; workout: LibraryWorkout };

/**
 * A planned workout on a day that is not today's to start: still to come, or missed, crossed
 * on its kind's mark, which the card and its ··· open the sheet to log, reschedule or skip.
 */
export function OccurrenceRow({ occurrence, workout }: OccurrenceRowProps): React.ReactElement {
  const { model } = useHangData();
  const { status } = occurrence;
  const missed = status === "missed";
  const changes = useDayChanges();
  const [menu, setMenu] = React.useState(false);
  const planned = plannedItems(occurrence);
  const tag = occurrenceTag(t("hang.planned"), occurrence);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        overflow: "hidden",
      }}
    >
      {missed ? (
        <KindCircle kind={workout.kind} badge="missed" />
      ) : (
        <DayMark kind={workout.kind} filled={false} />
      )}
      <Pressable
        onPress={() => (missed ? setMenu(true) : openOccurrence(occurrence))}
        accessibilityRole="button"
        accessibilityLabel={missed ? `${t("hang.missed")}: ${workout.name}` : undefined}
        style={pressRow({ flex: 1, gap: 3, paddingVertical: missed ? 12 : 10 })}
      >
        {!missed && (
          <Label small color={KIND_LOOK[workout.kind].ink}>
            {tag}
          </Label>
        )}
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {workout.name}
        </Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {occurrenceMeta(occurrence, model.settings.units)}
        </Text>
      </Pressable>
      {(status === "planned" || missed) && (
        <DetailMenu
          open={menu}
          onOpenChange={setMenu}
          rows={dayRows(
            (kind) => changes.open(kind, occurrence, workout.name),
            missed ? () => logLibraryWorkout(workout, occurrence.date, planned) : undefined,
            changes.remove(occurrence)
          )}
        />
      )}
      {changes.sheets}
    </View>
  );
}

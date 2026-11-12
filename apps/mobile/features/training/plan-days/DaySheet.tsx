import React from "react";
import { View } from "react-native";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { occurrenceLink, type Occurrence, KIND_LOOK } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { MenuRow } from "../../live-session/MenuRow";
import { SheetHeader } from "../components/SheetHeader";
import { HangSheet } from "../data/HangSheet";
import { DayLine } from "../library-detail/DayLine";
import { LogItButton } from "../library-detail/LogItButton";
import { StartButton } from "../library-detail/StartButton";
import { logLibraryWorkout } from "../library-detail/startLibraryWorkout";
import { openMembership } from "../plan/openMembership";
import { dayRows } from "./dayRows";

export type DaySheetProps = {
  occurrence: Occurrence;
  workout: LibraryWorkout;
  onChange: (kind: "move" | "skip") => void;
  onClose: () => void;
};

/**
 * One planned day of a block's week: reschedule or skip it, log it or start it; a missed one is
 * logged from its rows, as it can no longer be started. Its name opens the workout.
 */
export function DaySheet({
  occurrence: o,
  workout,
  onChange,
  onClose,
}: DaySheetProps): React.ReactElement {
  const planned = { link: occurrenceLink(o), items: o.items, session: o.session };
  const missed = o.status === "missed";
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.close")}>
      <View style={{ gap: 16, paddingBottom: 12 }}>
        <SheetHeader
          kicker={o.block?.name ?? kindLabel(workout.kind)}
          kickerColor={KIND_LOOK[workout.kind].ink}
          title={workout.name}
          onTitle={() => {
            onClose();
            openMembership(o.membership, o.block?.name);
          }}
          under={<DayLine week={o.week} date={o.date} missed={missed} />}
          action={t("common.close")}
          onAction={onClose}
        />
        <View style={{ gap: 4 }}>
          {dayRows(
            onChange,
            missed ? () => logLibraryWorkout(workout, o.date, planned) : undefined
          ).map(({ onPress, ...row }) => (
            <MenuRow
              key={row.title}
              {...row}
              onPress={() => {
                onClose();
                onPress();
              }}
            />
          ))}
        </View>
        {!missed && (
          <View style={{ gap: 8 }}>
            <LogItButton
              workout={workout}
              date={o.date}
              label={t("workouts.logIt")}
              planned={planned}
              height={48}
            />
            <StartButton workout={workout} date={o.date} planned={planned} height={50} />
          </View>
        )}
      </View>
    </HangSheet>
  );
}

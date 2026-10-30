import React from "react";
import { View } from "react-native";
import { weekday } from "@sendtally/core/hang";
import { weekdayShort } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { occurrenceLink, type Occurrence } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { MenuRow } from "../../live-session/MenuRow";
import { SheetHeader } from "../components/SheetHeader";
import { HangSheet } from "../data/HangSheet";
import { LogItButton } from "../library-detail/LogItButton";
import { StartButton } from "../library-detail/StartButton";
import { openMembership } from "../plan/openMembership";
import { KIND_LOOK } from "../today/kindLook";
import { dayRows } from "./dayRows";

export type DaySheetProps = {
  occurrence: Occurrence;
  workout: LibraryWorkout;
  onChange: (kind: "move" | "skip") => void;
  onClose: () => void;
};

/** One planned day of a block's week: start it or log it, move or skip it, or open the workout. */
export function DaySheet({
  occurrence: o,
  workout,
  onChange,
  onClose,
}: DaySheetProps): React.ReactElement {
  const planned = { link: occurrenceLink(o), items: o.items, session: o.session };
  const rows = [
    ...dayRows(onChange),
    {
      icon: "chevron" as const,
      title: t("plan.openWorkout"),
      hint: t("plan.openWorkoutHint"),
      onPress: () => openMembership(o.membership, o.block?.name),
    },
  ];
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.close")}>
      <View style={{ gap: 16, paddingBottom: 12 }}>
        <SheetHeader
          kicker={t("plan.dayKicker", {
            day: weekdayShort(weekday(o.date)),
            block: o.block?.name ?? "",
            n: o.week ?? 1,
          })}
          kickerColor={KIND_LOOK[workout.kind].ink}
          title={workout.name}
          action={t("common.close")}
          onAction={onClose}
        />
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
        <View style={{ gap: 4 }}>
          {rows.map(({ onPress, ...row }) => (
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
      </View>
    </HangSheet>
  );
}

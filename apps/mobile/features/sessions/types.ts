import type { ClimbLogRowVM } from "@sendtally/features/climbs";
import type { LogItem } from "@sendtally/features/journal";
import type { WorkoutKind } from "@sendtally/core/hang";
import type { MenuRowProps } from "../live-session/MenuRow";

/** A made-up row in an empty log's preview, days back from today. */
export type ExampleRowData = {
  daysAgo: number;
  title: string;
  meta: string;
  kind?: WorkoutKind;
};

export type LogEmptyAction = Pick<MenuRowProps, "icon" | "title" | "onPress" | "external"> & {
  key: string;
};

/** A row of the Log: a log item, or one climb in the per-climb list. */
export type LogRow = LogItem | { type: "climb"; key: string; row: ClimbLogRowVM };

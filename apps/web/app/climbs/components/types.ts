import type { ClimbLogRowVM } from "@sendtally/features/climbs";
import type { LogItem } from "@sendtally/features/journal";

/** A row of the climbing log: a log item, or one climb in the filtered list. */
export type ClimbingLogRow = LogItem | { type: "climb"; key: string; row: ClimbLogRowVM };

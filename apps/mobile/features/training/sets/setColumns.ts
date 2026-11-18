import type { ViewStyle } from "react-native";

/** The set table's columns, shared by its heading row and every set: Set, Target, Done, RPE where it is asked, tick, and − on the current set. */
export const SET_COLUMNS = {
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  set: { width: 34, paddingLeft: 8 },
  target: { flex: 1 },
  done: { flexShrink: 0 },
  rpe: { width: 36, alignItems: "center" },
  tick: { width: 44 },
  remove: { width: 32, height: 40, alignItems: "center", justifyContent: "center" },
} satisfies Record<string, ViewStyle>;

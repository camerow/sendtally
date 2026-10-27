import type { ViewStyle } from "react-native";

/** The set table's columns, shared by its heading row and every set: Set, Target, Done, tick. */
export const SET_COLUMNS = {
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  set: { width: 34, paddingLeft: 8 },
  target: { flex: 1 },
  done: { flex: 1.3 },
  tick: { width: 44 },
} satisfies Record<string, ViewStyle>;

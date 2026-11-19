import type { ViewStyle } from "react-native";

/**
 * The one set grid, shared by every row and its headings: position, then the fields filling the
 * row (count and measure sharing it 2 to 3 around the join), RPE where it is asked, and the tick.
 */
export const SET_COLUMNS = {
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  position: { width: 30, paddingLeft: 6 },
  lead: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  count: { flex: 2, minWidth: 0 },
  join: { width: 10, alignItems: "center" },
  measure: { flex: 3, minWidth: 0 },
  rpe: { width: 40 },
  rpeRead: { width: 58, alignItems: "flex-end" },
  tick: { width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" },
} satisfies Record<string, ViewStyle>;

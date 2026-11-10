import React from "react";
import { Text, View } from "react-native";
import { sessionDay } from "@sendtally/features/sessions";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { CategoryMark } from "../training/library/CategoryMark";
import { rowMeta, rowTitle } from "./SessionRow";
import { DayColumn } from "./SessionRowParts";
import type { ExampleRowData } from "./types";

/** A log row drawn from made-up data, laid out as the real session and activity rows are. */
export function ExampleRow({ row, now }: { row: ExampleRowData; now: Date }): React.ReactElement {
  const at = new Date(now.getTime() - row.daysAgo * 86_400_000).toISOString();
  const { weekday, day } = sessionDay({ start_at: at });
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <DayColumn weekday={weekday} day={day} />
      {row.kind !== undefined && <CategoryMark kind={row.kind} size={28} />}
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={rowTitle}>
          {row.title}
        </Text>
        <Text numberOfLines={1} style={rowMeta}>
          {row.meta}
        </Text>
      </View>
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </View>
  );
}

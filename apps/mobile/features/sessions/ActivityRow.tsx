import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Activity } from "@sendtally/api-client";
import { activityAt, activityEffortLabel, activityMetaLabel } from "@sendtally/features/activities";
import { sessionDay } from "@sendtally/features/sessions";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";
import { SESSION_ROW_HEIGHT, rowMeta, rowTitle } from "./SessionRow";
import { DayColumn } from "./SessionRowParts";

/** Other training carries no tags, so it is always one plain row tall. */
export const ACTIVITY_ROW_HEIGHT = SESSION_ROW_HEIGHT;

export type ActivityRowProps = {
  activity: Activity;
  onPress: () => void;
  inset?: boolean;
  divider?: boolean;
};

/** A strength, mobility, run or other session in the log, laid out like a session row. */
export function ActivityRow({
  activity,
  onPress,
  inset = false,
  divider = true,
}: ActivityRowProps): React.ReactElement {
  const { weekday, day } = sessionDay({ start_at: activityAt(activity) });
  const meta = activityMetaLabel(activity);
  const effort = activityEffortLabel(activity);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[activity.title, `${weekday} ${day}`, meta, effort]
        .filter((part) => part !== null)
        .join(", ")}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: inset ? 0 : 18,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <DayColumn weekday={weekday} day={day} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={rowTitle}>
          {activity.title}
        </Text>
        <Text numberOfLines={1} style={rowMeta}>
          {meta}
        </Text>
      </View>
      {effort !== null && (
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            lineHeight: 13,
            letterSpacing: 0.44,
            color: colors.textMuted,
          }}
        >
          {effort}
        </Text>
      )}
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </Pressable>
  );
}

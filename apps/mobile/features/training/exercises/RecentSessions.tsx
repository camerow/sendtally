import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { setText } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { ExerciseSession } from "@sendtally/features/statistics";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";

const SHOWN = 5;

export type RecentSessionsProps = { sessions: readonly ExerciseSession[]; unit: WeightUnit };

/** The newest sessions of one exercise with their best set, each opening its activity. */
export function RecentSessions({ sessions, unit }: RecentSessionsProps): React.ReactElement {
  return (
    <View style={{ gap: 4 }}>
      <Label color={colors.gunmetal}>{t("statistics.lastSessions")}</Label>
      {sessions
        .slice(-SHOWN)
        .reverse()
        .map((s) => (
          <Pressable
            key={s.activityId}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/activity/[id]", params: { id: s.activityId } })
            }
            style={pressRow({
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderBottomWidth: 1,
              borderColor: colors.lineOnLight,
            })}
          >
            <Text style={[type.mono, { width: 64, fontSize: 12, color: colors.textSecondary }]}>
              {shortDate(s.date)}
            </Text>
            <Text style={[type.monoBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}>
              {setText(s.best, unit)}
            </Text>
          </Pressable>
        ))}
    </View>
  );
}

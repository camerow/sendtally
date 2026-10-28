import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";

export type PastSessionRow = {
  id: string;
  date: string;
  meta: string;
  effort: string | null;
  current: boolean;
};

export type PastSessionsProps = { rows: readonly PastSessionRow[] };

/** Every session of this workout, newest first, once there is more than this one; another opens its own summary. */
export function PastSessions({ rows }: PastSessionsProps): React.ReactElement | null {
  if (rows.length < 2) return null;
  return (
    <View style={{ gap: 2, paddingTop: 4 }}>
      <Label color={colors.gunmetal}>{t("summary.pastSessions")}</Label>
      {rows.map((r) => (
        <Pressable
          key={r.id}
          accessibilityRole="button"
          disabled={r.current}
          onPress={() => router.push({ pathname: "/activity/[id]", params: { id: r.id } })}
          style={pressRow({
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 8,
            marginHorizontal: -8,
            borderRadius: 10,
            backgroundColor: r.current ? "rgba(249,220,92,0.25)" : undefined,
          })}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.bodyBold, { fontSize: 14.5, color: colors.gunmetal }]}>
              {r.current ? t("summary.thisSession", { date: r.date }) : r.date}
            </Text>
            <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>
              {r.meta}
            </Text>
          </View>
          {r.effort !== null && (
            <Text style={[type.monoBold, { fontSize: 12.5, color: colors.gunmetal }]}>
              {r.effort}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

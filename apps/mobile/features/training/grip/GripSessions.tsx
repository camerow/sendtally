import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { GripSessionVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";
import { DayColumn } from "../../sessions/SessionRowParts";
import { rowMeta, rowTitle } from "../../sessions/SessionRow";

/**
 * Every session on the grip, newest first, read like the log: its day, this grip's hangs with Best
 * on a best, the edge and time under tension, and the added weight rightmost.
 */
export function GripSessions({ rows }: { rows: readonly GripSessionVM[] }): React.ReactElement {
  return (
    <View style={{ gap: 2 }}>
      <Label color={colors.gunmetal}>
        {t("hang.history", { count: t("hang.sessionCount", { count: rows.length }) })}
      </Label>
      {rows.map((s, i) => (
        <Pressable
          key={`${s.id}:${i}`}
          accessibilityRole="button"
          accessibilityLabel={[
            `${s.weekday} ${s.day}`,
            s.title,
            s.meta,
            s.load,
            ...(s.best ? [t("statistics.best")] : []),
          ].join(", ")}
          onPress={() => router.push({ pathname: "/activity/[id]", params: { id: s.id } })}
          style={pressRow({
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 11,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnLightSoft,
          })}
        >
          <DayColumn weekday={s.weekday} day={s.day} />
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text numberOfLines={1} style={{ flexShrink: 1, ...rowTitle }}>
                {s.title}
              </Text>
              {s.best && (
                <Label
                  small
                  color={colors.gunmetal}
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 5,
                    overflow: "hidden",
                    backgroundColor: colors.gold,
                  }}
                >
                  {t("statistics.best")}
                </Label>
              )}
            </View>
            {s.meta !== "" && (
              <Text numberOfLines={1} style={rowMeta}>
                {s.meta}
              </Text>
            )}
          </View>
          <Text style={[type.monoBold, { flexShrink: 0, fontSize: 15, color: colors.gunmetal }]}>
            {s.load}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

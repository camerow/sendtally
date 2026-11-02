import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { GripSessionVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";

/** Every session on the grip, newest first: load, day and setup, completion, Best on a best. */
export function GripSessions({ rows }: { rows: readonly GripSessionVM[] }): React.ReactElement {
  return (
    <View style={{ gap: 2 }}>
      <Label color={colors.gunmetal}>
        {t("hang.history", { count: t("hang.sessionCount", { count: rows.length }) })}
      </Label>
      {rows.map((s) => (
        <Pressable
          key={s.id}
          accessibilityRole="button"
          accessibilityLabel={[
            s.load,
            s.meta,
            s.completion,
            ...(s.best ? [t("statistics.best")] : []),
          ].join(", ")}
          onPress={() => router.push({ pathname: "/activity/[id]", params: { id: s.id } })}
          style={pressRow({
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnLight,
          })}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={[type.monoBold, { fontSize: 15, color: colors.gunmetal }]}>
                {s.load}
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
            <Text style={[type.mono, { fontSize: 11, color: colors.textMuted }]}>{s.meta}</Text>
          </View>
          <Text style={[type.monoBold, { fontSize: 12, color: colors.textSecondary }]}>
            {s.completion}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

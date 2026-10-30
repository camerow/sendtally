import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbLogRowVM, ClimbPillKind } from "@sendtally/features/climbs";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";
import { GradeBadge } from "./GradeBadge";

const PILLS: Record<ClimbPillKind, { fill: string; ink: string; line?: string }> = {
  flash: { fill: colors.gold, ink: colors.gunmetal },
  onsight: { fill: "rgba(21,127,82,0.14)", ink: colors.fern },
  sent: { fill: colors.lineOnLightSoft, ink: colors.gunmetal },
  project: { fill: colors.gunmetal, ink: colors.gold },
  tries: { fill: "transparent", ink: colors.textSecondary, line: colors.lineOnLightStrong },
};

/** One climb in the log: its grade, name, crag and when, and how it went. */
export function ClimbLogRow({ row }: { row: ClimbLogRowVM }): React.ReactElement {
  const pill = PILLS[row.pill.kind];
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/climb/[id]", params: { id: row.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${row.gradeLabel}, ${row.name}, ${row.meta}, ${row.pill.label}`}
      style={pressRow({
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <GradeBadge label={row.gradeLabel} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
        >
          {row.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary }}
        >
          {row.meta}
        </Text>
      </View>
      <View
        style={{
          height: 24,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          borderRadius: 12,
          backgroundColor: pill.fill,
          borderWidth: pill.line === undefined ? 0 : 1,
          borderColor: pill.line,
        }}
      >
        {row.pill.kind === "project" && (
          <Icon name="star" color={colors.gold} size={12} strokeWidth={2.2} />
        )}
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: pill.ink }}>
          {row.pill.label}
        </Text>
      </View>
    </Pressable>
  );
}

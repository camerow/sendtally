import React from "react";
import { Text, View } from "react-native";
import type { ProjectListItem } from "@sendtally/features/climbs";
import { colors, fonts } from "@sendtally/design/tokens";
import { ProjectRow } from "./ProjectRow";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

export function ProjectSection({
  title,
  meta,
  items,
}: {
  title: string;
  meta: string;
  items: ProjectListItem[];
}): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 10,
          marginHorizontal: 18,
          marginTop: 22,
          paddingBottom: 9,
          borderBottomWidth: 1,
          borderBottomColor: colors.lineOnLight,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 15,
            letterSpacing: -0.3,
            color: colors.gunmetal,
          }}
        >
          {title}
        </Text>
        <Text style={{ ...label, color: colors.textMuted }}>{meta}</Text>
      </View>
      {items.map((item) => (
        <ProjectRow key={item.climb.slug} item={item} />
      ))}
    </View>
  );
}

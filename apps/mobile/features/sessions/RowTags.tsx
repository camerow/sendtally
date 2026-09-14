import React from "react";
import { Text, View } from "react-native";
import type { SessionTag } from "@sendtally/api-client";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export const ROW_TAGS_HEIGHT = 17;

export function RowTags({ tags }: { tags: SessionTag[] }): React.ReactElement | null {
  if (tags.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {tags.map((tag) => (
        <Text
          key={tag.id}
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 8,
            lineHeight: 10,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: radius.pill,
            overflow: "hidden",
            backgroundColor: colors.petalTint,
            color: colors.gunmetal,
          }}
        >
          {tag.name}
        </Text>
      ))}
    </View>
  );
}

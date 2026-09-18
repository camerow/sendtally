import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import type { TrendGroupVM } from "@sendtally/features/trends";
import { card, monoLabel } from "./styles";
import { TrendTile } from "./TrendTile";

export function TrendSection({
  group,
  locked,
  onLocked,
}: {
  group: TrendGroupVM;
  locked: boolean;
  onLocked?: () => void;
}): React.ReactElement {
  return (
    <View style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
      <View
        style={{
          padding: 18,
          gap: 6,
          backgroundColor: "#FCFBF8",
          borderBottomWidth: 1,
          borderBottomColor: colors.lineOnLightSoft,
        }}
      >
        <Text style={{ ...monoLabel, fontSize: 10 }}>{group.question}</Text>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            letterSpacing: -0.4,
            color: colors.gunmetal,
          }}
        >
          {group.title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            lineHeight: 21,
            color: colors.textSecondary,
          }}
        >
          {group.insight}
        </Text>
      </View>
      {group.tiles.map((tile, i) => (
        <View
          key={tile.id}
          style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.lineOnLightSoft } : undefined}
        >
          <TrendTile tile={tile} locked={locked} onLocked={onLocked} />
        </View>
      ))}
    </View>
  );
}

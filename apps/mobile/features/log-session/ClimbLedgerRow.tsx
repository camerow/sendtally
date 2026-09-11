import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";

export type ClimbLedgerRowProps = {
  climb: ClimbDraft;
  project: boolean;
  onPress: () => void;
};

export function ClimbLedgerRow({
  climb,
  project,
  onPress,
}: ClimbLedgerRowProps): React.ReactElement {
  const named = climb.name.trim() !== "";
  const send = climb.kind === "send";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${climb.grade} ${named ? climb.name : "unnamed"}, ${send ? "send" : "attempt"}, ${climb.tries} tries`}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        height: 52,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <View
        style={{
          minWidth: 44,
          height: 32,
          flexShrink: 0,
          paddingHorizontal: 9,
          borderRadius: 8,
          backgroundColor: colors.surfaceSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 14, color: colors.gunmetal }}>
          {climb.grade}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 }}>
        {project && <Icon name="projects" color={colors.gunmetal} size={14} strokeWidth={2} />}
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            fontFamily: named ? fonts.sansSemiBold : fonts.sans,
            fontSize: 15,
            color: named ? colors.gunmetal : colors.textFaint,
          }}
        >
          {named ? climb.name : "Unnamed"}
        </Text>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: 11,
          backgroundColor: send ? colors.azureInk : colors.gunmetal,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 12, color: colors.white }}>
          {send ? "✓" : "✗"}
        </Text>
      </View>
      <Text
        style={{
          width: 30,
          flexShrink: 0,
          textAlign: "right",
          fontFamily: fonts.monoMedium,
          fontSize: 13,
          color: colors.textMuted,
        }}
      >
        ×{climb.tries}
      </Text>
      <Icon name="chevron" color={colors.textFaint} size={16} />
    </Pressable>
  );
}

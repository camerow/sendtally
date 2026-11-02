import React from "react";
import { Pressable, Text, View } from "react-native";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";

export type TallyRowProps = {
  climb: ClimbDraft;
  selected: boolean;
  onPress: () => void;
  onEdit: () => void;
};

/** One climb: hollow dots for its falls, a tick once sent. The selected one is what Fell and Sent act on. */
export function TallyRow({ climb, selected, onPress, onEdit }: TallyRowProps): React.ReactElement {
  const sent = climb.kind === "send";
  const falls = Math.max(0, climb.tries - (sent ? 1 : 0));
  const grade = climb.circuit === undefined ? climb.grade : climb.circuit.label;
  const name = climb.name.trim();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={[
        grade,
        ...(name === "" ? [] : [name]),
        t("tally.fallCount", { count: falls }),
        ...(sent ? [t("common.sent")] : []),
      ].join(", ")}
      style={{
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingLeft: 8,
        paddingRight: 6,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: selected ? colors.gold : "transparent",
        backgroundColor: selected ? "rgba(249,220,92,0.08)" : "rgba(255,255,255,0.05)",
      }}
    >
      <View
        style={{
          width: 44,
          height: 40,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            climb.circuit === undefined
              ? "rgba(255,255,255,0.12)"
              : CIRCUIT_HEX[climb.circuit.colour],
        }}
      >
        {climb.circuit === undefined && (
          <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 15, color: colors.white }}>
            {climb.grade}
          </Text>
        )}
      </View>
      <View
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" }}
      >
        {name !== "" && (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.sansMedium,
              fontSize: 14,
              color: colors.white,
              marginRight: 4,
            }}
          >
            {name}
          </Text>
        )}
        {Array.from({ length: falls }, (_, i) => (
          <View
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.7)",
            }}
          />
        ))}
        {sent && <Icon name="check" color={colors.gold} size={20} strokeWidth={3} />}
      </View>
      {selected && (
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={t("tally.editClimb")}
          style={press({ width: 44, height: 44, alignItems: "center", justifyContent: "center" })}
        >
          <Icon name="pencil" color={colors.white} size={18} strokeWidth={1.9} />
        </Pressable>
      )}
    </Pressable>
  );
}

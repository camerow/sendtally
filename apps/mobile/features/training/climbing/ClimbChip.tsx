import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { type } from "../type";

export type ClimbChipProps = {
  climb: ClimbDraft;
  /** A tap turns a send into an attempt and back. */
  onFlip: () => void;
  /** A hold opens the climb's editor. */
  onEdit: () => void;
};

/** One climb of a set: grey with a tick once sent, outlined as an attempt. */
export function ClimbChip({ climb, onFlip, onEdit }: ClimbChipProps): React.ReactElement {
  const sent = climb.kind === "send";
  const label = climb.circuit?.label ?? climb.grade;
  const dot = climb.circuit === undefined ? undefined : CIRCUIT_HEX[climb.circuit.colour];
  return (
    <Pressable
      onPress={onFlip}
      onLongPress={onEdit}
      hitSlop={{ top: 7, bottom: 7 }}
      accessibilityActions={[{ name: "longpress", label: t("tally.editClimb") }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === "longpress") onEdit();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${sent ? t("logSession.sentTapToAttempt") : t("logSession.attemptTapToSent")}`}
      accessibilityHint={t("tally.editClimb")}
      style={press({
        height: 30,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: sent ? 0 : 1.5,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: sent ? colors.lineOnLight : colors.white,
      })}
    >
      {dot !== undefined && (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dot,
            borderWidth: 1,
            borderColor: colors.lineOnLightStrong,
          }}
        />
      )}
      <Text style={[type.monoBold, { fontSize: 13, color: colors.gunmetal }]}>{label}</Text>
      {sent && <Icon name="check" size={12} strokeWidth={3} color={colors.fern} />}
    </Pressable>
  );
}

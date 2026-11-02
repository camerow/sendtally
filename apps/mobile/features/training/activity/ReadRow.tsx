import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { Label } from "../components/Label";
import { type } from "../type";

export type ReadRowProps = {
  label: string;
  value: string;
  /** Opens the row as its field; without it the row only reads. */
  onEdit?: () => void;
};

/** A value a live run measured, read on one line; tap it to type over it. */
export function ReadRow({ label, value, onEdit }: ReadRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onEdit}
      disabled={onEdit === undefined}
      accessibilityRole={onEdit === undefined ? undefined : "button"}
      accessibilityLabel={`${label}, ${value}`}
      style={pressRow({
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <Label color={colors.textSecondary} style={{ flex: 1 }}>
        {label}
      </Label>
      <Text style={[type.monoBold, { fontSize: 15, color: colors.gunmetal }]}>{value}</Text>
      {onEdit !== undefined && (
        <HangIcon name="edit" color={colors.textMuted} size={14} strokeWidth={1.8} />
      )}
    </Pressable>
  );
}

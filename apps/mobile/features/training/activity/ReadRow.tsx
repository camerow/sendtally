import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { Label } from "../components/Label";
import { type } from "../type";

export type ReadRowProps = {
  label: string;
  value: string;
  /** Under the label, such as where the value came from. */
  note?: string;
  /** Opens the row as its field; without it the row only reads. */
  onEdit?: () => void;
};

/** A value a live run measured, read on one line; tap it to type over it. */
export function ReadRow({ label, value, note, onEdit }: ReadRowProps): React.ReactElement {
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
      <View style={{ flex: 1, gap: 2 }}>
        <Label color={colors.textSecondary}>{label}</Label>
        {note !== undefined && (
          <Text style={[type.mono, { fontSize: 11, color: colors.textMuted }]}>{note}</Text>
        )}
      </View>
      <Text style={[type.monoBold, { fontSize: 15, color: colors.gunmetal }]}>{value}</Text>
      {onEdit !== undefined && (
        <HangIcon name="edit" color={colors.textMuted} size={14} strokeWidth={1.8} />
      )}
    </Pressable>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { type } from "../type";
import { IconButton } from "./IconButton";
import { Label } from "./Label";

export type PlanRowProps = {
  tag: string;
  tagColor: string;
  name?: string;
  meta: string;
  onOpen: () => void;
  onRemove: () => void;
  removeLabel: string;
};

/** A scheduled workout: tap to edit, × to remove. */
export function PlanRow({
  tag,
  tagColor,
  name,
  meta,
  onOpen,
  onRemove,
  removeLabel,
}: PlanRowProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingLeft: 14,
        paddingRight: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        style={pressRow({ flex: 1, gap: 3, paddingVertical: 12 })}
      >
        <Label small color={tagColor}>
          {tag}
        </Label>
        {name !== undefined && (
          <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{name}</Text>
        )}
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
      </Pressable>
      <IconButton icon="x" label={removeLabel} onPress={onRemove} color={colors.textSecondary} />
    </View>
  );
}

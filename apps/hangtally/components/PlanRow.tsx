import React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";
import { IconButton } from "./IconButton";
import { Label } from "./Label";

export type PlanRowProps = {
  tag: string;
  tagColor: string;
  name?: string;
  meta: string;
  look?: "outline" | "filled" | "missed";
  onOpen: () => void;
  onRemove: () => void;
  removeLabel: string;
};

/** A scheduled workout: tap to edit, × to remove or skip. */
export function PlanRow({
  tag,
  tagColor,
  name,
  meta,
  look = "outline",
  onOpen,
  onRemove,
  removeLabel,
}: PlanRowProps): React.ReactElement {
  const c = useTheme();
  const frame: ViewStyle =
    look === "missed"
      ? { borderWidth: 1.5, borderStyle: "dashed", borderColor: c.lineDark, opacity: 0.8 }
      : {
          borderWidth: 1,
          borderColor: c.lineDark,
          backgroundColor: look === "filled" ? c.deep : undefined,
        };
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingLeft: 16,
          paddingRight: 8,
          borderRadius: 16,
        },
        frame,
      ]}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        style={({ pressed }) => ({ flex: 1, gap: 3, opacity: pressed ? 0.7 : 1 })}
      >
        <Label small color={tagColor}>
          {tag}
        </Label>
        {name !== undefined && (
          <Text style={[type.bodyBold, { fontSize: 16, color: c.onDark }]}>{name}</Text>
        )}
        <Text
          style={[
            type.mono,
            {
              fontSize: name === undefined ? 13 : 12,
              color: name === undefined ? c.onDark2 : c.onDark3,
            },
          ]}
        >
          {meta}
        </Text>
      </Pressable>
      <IconButton
        icon="x"
        label={removeLabel}
        onPress={onRemove}
        color={c.onDark3}
        border={c.lineDark}
      />
    </View>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { type } from "../type";
import { HangIcon, type HangIconName } from "./HangIcon";
import { IconButton } from "./IconButton";
import { Label } from "./Label";
import { GOLD_TINT } from "./tints";

export type PlanRowProps = {
  tag: string;
  tagColor: string;
  name?: string;
  meta: string;
  /** Without it the row only shows the plan. */
  onOpen?: () => void;
  /** Without it the row has no trailing button. */
  onRemove?: () => void;
  removeLabel?: string;
  mark?: React.ReactNode;
  /** The trailing button's icon: × by default. */
  actionIcon?: HangIconName;
  /** Just added: drawn on gold. */
  lit?: boolean;
};

/** A planned workout: tap to open, × to remove where it can be. */
export function PlanRow({
  tag,
  tagColor,
  name,
  meta,
  onOpen,
  onRemove,
  removeLabel,
  mark,
  actionIcon = "x",
  lit = false,
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
        borderColor: lit ? colors.gold : colors.lineOnLight,
        backgroundColor: lit ? GOLD_TINT : undefined,
        overflow: "hidden",
      }}
    >
      {mark}
      <Pressable
        onPress={onOpen}
        disabled={onOpen === undefined}
        accessibilityRole={onOpen === undefined ? undefined : "button"}
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
      {onRemove !== undefined && removeLabel !== undefined ? (
        <IconButton
          icon={actionIcon}
          label={removeLabel}
          onPress={onRemove}
          color={colors.textSecondary}
        />
      ) : (
        onOpen !== undefined && (
          <View style={{ paddingHorizontal: 8 }}>
            <HangIcon name="forward" color={colors.textSecondary} size={16} strokeWidth={2.2} />
          </View>
        )
      )}
    </View>
  );
}

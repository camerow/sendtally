import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { tap } from "../lib/press";
import { Keypad, type KeypadMode } from "./Keypad";
import type { FieldSlot } from "./useFieldOrder";

export type KeypadFieldProps = FieldSlot & {
  /** Shown above the box unless `hideLabel`, and on the keypad. */
  label: string;
  /** What a screen reader and the keypad call it, when the label alone is not enough. */
  accessibilityLabel?: string;
  /** For a field whose section already names it. */
  hideLabel?: boolean;
  mode: KeypadMode;
  value: number;
  /** The value as read: dimmed leading part, then the rest. */
  text: readonly [dim: string, rest: string];
  /** Inside the box, on the right. */
  unit?: string;
  onChange: (value: number) => void;
};

/** A typable number: a white box that opens the in-app keypad, gold while it is open. */
export function KeypadField({
  label,
  accessibilityLabel = label,
  hideLabel = false,
  mode,
  value,
  text: [dim, rest],
  unit,
  onChange,
  open: openSlot,
  onOpen,
  onClose,
  onNext,
}: KeypadFieldProps): React.ReactElement {
  const [openOwn, setOpenOwn] = React.useState(false);
  const open = openSlot ?? openOwn;
  return (
    <View style={{ gap: 6 }}>
      {!hideLabel && (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.textSecondary,
          }}
        >
          {label}
        </Text>
      )}
      <Pressable
        onPress={tap(onOpen ?? (() => setOpenOwn(true)))}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: `${dim}${rest}${unit === undefined ? "" : ` ${unit}`}` }}
        accessibilityState={{ expanded: open }}
        style={{
          minHeight: 46,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          paddingHorizontal: open ? 11.3 : 12,
          borderRadius: radius.control,
          backgroundColor: colors.white,
          borderWidth: open ? 2 : 1.3,
          borderColor: open ? colors.gold : colors.lineOnLightStrong,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            fontFamily: fonts.monoSemiBold,
            fontSize: 17,
            color: colors.gunmetal,
          }}
        >
          <Text style={{ color: colors.textFaint }}>{dim}</Text>
          {rest}
        </Text>
        {unit !== undefined && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary }}>
            {unit}
          </Text>
        )}
      </Pressable>
      <Keypad
        visible={open}
        label={accessibilityLabel}
        mode={mode}
        value={value}
        onCommit={onChange}
        onClose={onClose ?? (() => setOpenOwn(false))}
        onNext={onNext}
      />
    </View>
  );
}

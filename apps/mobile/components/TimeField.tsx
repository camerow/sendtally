import React from "react";
import { Pressable, Text, View } from "react-native";
import { openTime, timeText } from "@sendtally/core/hang";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { tap } from "../lib/press";
import { Keypad } from "./Keypad";

export type TimeFieldProps = {
  label: string;
  /** Seconds. */
  value: number;
  /** Called with the new length on Done, Next or a tap outside, only when it changed. */
  onChange: (seconds: number) => void;
  min?: number;
  max?: number;
  /** Shows Next on the keypad, which commits and then calls this. */
  onNext?: () => void;
};

/** A length of time read as HH:MM:SS with its leading zeros dimmed, typed on the in-app keypad. */
export function TimeField({
  label,
  value,
  onChange,
  min,
  max,
  onNext,
}: TimeFieldProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [zeros, rest] = timeText(openTime(value, { min, max }));
  return (
    <View style={{ gap: 6 }}>
      <Text
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
      <Pressable
        onPress={tap(() => setOpen(true))}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: zeros + rest }}
        accessibilityState={{ expanded: open }}
        style={{
          minHeight: 46,
          justifyContent: "center",
          paddingHorizontal: open ? 11.3 : 12,
          borderRadius: radius.control,
          backgroundColor: colors.white,
          borderWidth: open ? 2 : 1.3,
          borderColor: open ? colors.gold : colors.lineOnLightStrong,
        }}
      >
        <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 17, color: colors.gunmetal }}>
          <Text style={{ color: colors.textFaint }}>{zeros}</Text>
          {rest}
        </Text>
      </Pressable>
      <Keypad
        visible={open}
        label={label}
        mode={{ kind: "time", min, max }}
        value={value}
        onCommit={onChange}
        onClose={() => setOpen(false)}
        onNext={onNext}
      />
    </View>
  );
}

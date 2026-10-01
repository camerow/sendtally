import React from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";

export type ChipProps = {
  label: string;
  on: boolean;
  onPress: () => void;
  fill: string;
  small?: boolean;
};

/** A pill on the dark ground: filled when on, outlined when off. */
export function Chip({ label, on, onPress, fill, small }: ChipProps): React.ReactElement {
  const c = useTheme();
  const height = small ? 30 : 36;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      hitSlop={small ? 7 : 4}
      style={{
        height,
        paddingHorizontal: small ? 12 : 14,
        borderRadius: height / 2,
        justifyContent: "center",
        backgroundColor: on ? fill : undefined,
        borderWidth: on ? 0 : 1,
        borderColor: c.lineDark,
      }}
    >
      <Text
        style={[
          small ? type.body : type.bodyBold,
          { fontSize: small ? 13 : 14, color: on ? c.ground : c.onDark2 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

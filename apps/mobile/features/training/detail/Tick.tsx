import React from "react";
import { Pressable, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { HangIcon } from "../components/HangIcon";

export type TickProps = { done: boolean; label: string; onToggle: () => void; color: string };

/** A 28px box on a 44px target, filled with `color` once done. */
export function Tick({ done, label, onToggle, color }: TickProps): React.ReactElement {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: done }}
      style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: done ? color : undefined,
          borderWidth: done ? 0 : 1.5,
          borderColor: colors.lineOnLightStrong,
        }}
      >
        {done && <HangIcon name="check" color={colors.white} size={16} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

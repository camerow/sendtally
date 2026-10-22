import React from "react";
import { Pressable } from "react-native";
import { press } from "../lib/press";
import { SwitchTrack } from "./SwitchTrack";

export type SwitchProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
  label: string;
};

export function Switch({ checked, onChange, disabled, label }: SwitchProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      hitSlop={10}
      style={press({})}
    >
      <SwitchTrack checked={checked} disabled={disabled} />
    </Pressable>
  );
}

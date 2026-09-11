import type { StyleProp, ViewStyle } from "react-native";

type PressState = { pressed: boolean };

const PRESSED_TINT = "rgba(64,63,76,0.06)";

/** Dims a control while it is held. For buttons, chips, icons and anything with its own fill. */
export function press(style: StyleProp<ViewStyle>): (state: PressState) => StyleProp<ViewStyle> {
  return ({ pressed }) => (pressed ? [style, { opacity: 0.62 }] : style);
}

/** Tints a row while it is held. For list rows and other flat surfaces, where dimming reads as a glitch. */
export function pressRow(style: StyleProp<ViewStyle>): (state: PressState) => StyleProp<ViewStyle> {
  return ({ pressed }) => (pressed ? [style, { backgroundColor: PRESSED_TINT }] : style);
}

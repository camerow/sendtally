import type { StyleProp, ViewStyle } from "react-native";

/** Dims a control while it is held. */
export function press(
  style: StyleProp<ViewStyle>
): (state: { pressed: boolean }) => StyleProp<ViewStyle> {
  return ({ pressed }) => (pressed ? [style, { opacity: 0.7 }] : style);
}

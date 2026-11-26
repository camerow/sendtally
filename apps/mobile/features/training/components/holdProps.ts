import type { PressableProps } from "react-native";
import type { LongPress } from "./types";

/** A row's long press, and the same action offered to a screen reader. */
export const holdProps = (hold: LongPress | undefined): PressableProps =>
  hold === undefined
    ? {}
    : {
        onLongPress: hold.onPress,
        accessibilityHint: hold.label,
        accessibilityActions: [{ name: "longpress", label: hold.label }],
        onAccessibilityAction: (e) => {
          if (e.nativeEvent.actionName === "longpress") hold.onPress();
        },
      };

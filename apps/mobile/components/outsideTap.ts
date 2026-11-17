import React from "react";
import { Keyboard, type GestureResponderEvent, type ViewProps } from "react-native";

const TAP_SLOP = 10;

const listeners = new Set<() => void>();
let onInput = false;

/**
 * Taps anywhere in the app, seen at its root without taking them from what they land on.
 * A keypad field and the keypad stop their touches reaching the root, so only a tap elsewhere
 * closes the keypad; a text input marks its own, so it keeps the system keyboard.
 */
export const outsideTap = {
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  onTextInput: (): void => {
    onInput = true;
  },
};

export function useOutsideTapRoot(): Pick<
  ViewProps,
  "onTouchStart" | "onTouchEnd" | "onTouchCancel"
> {
  const from = React.useRef<{ x: number; y: number } | null>(null);
  return React.useMemo(
    () => ({
      onTouchStart: (e: GestureResponderEvent) => {
        from.current =
          e.nativeEvent.touches.length > 1
            ? null
            : { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      },
      onTouchCancel: () => {
        from.current = null;
        onInput = false;
      },
      onTouchEnd: (e: GestureResponderEvent) => {
        const start = from.current;
        const input = onInput;
        from.current = null;
        onInput = false;
        if (start === null) return;
        const moved = Math.hypot(e.nativeEvent.pageX - start.x, e.nativeEvent.pageY - start.y);
        if (moved > TAP_SLOP) return;
        if (!input) Keyboard.dismiss();
        listeners.forEach((l) => l());
      },
    }),
    []
  );
}

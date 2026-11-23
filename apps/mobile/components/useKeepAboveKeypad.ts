import React from "react";
import { useWindowDimensions, type ScrollView, type View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { keypadHeight } from "./Keypad";
import {
  CLEARANCE,
  useKeepFocusedAboveKeys,
  type KeepFocusedAboveKeys,
} from "./useKeepFocusedAboveKeys";

export type KeepAboveKeypad = {
  /** Spread on the scroll view. */
  scrollProps: KeepFocusedAboveKeys["scrollProps"];
  scrollRef: React.RefObject<ScrollView | null>;
  /** Scrolls just far enough that the field's bottom sits above the keypad. */
  reveal: (field: View | null) => void;
  /** Room to leave under the content while the keypad is up, so the last field can rise above it. */
  room: number;
};

/**
 * Keeps a field opened on the in-app keypad in sight, and a focused text input above the system
 * keyboard (`useKeepFocusedAboveKeys`): spread `scrollProps` on its scroll view.
 */
export function useKeepAboveKeypad(): KeepAboveKeypad {
  const { scrollProps, scrollRef, offset } = useKeepFocusedAboveKeys();
  const { height: windowHeight } = useWindowDimensions();
  const room = keypadHeight(useSafeAreaInsets().bottom);
  const reveal = React.useCallback(
    (field: View | null): void => {
      requestAnimationFrame(() =>
        field?.measureInWindow((_x, y, _width, height) => {
          const over = y + height + CLEARANCE - (windowHeight - room);
          if (over > 0) scrollRef.current?.scrollTo({ y: offset.current + over, animated: true });
        })
      );
    },
    [windowHeight, room, scrollRef, offset]
  );
  return { scrollProps, scrollRef, reveal, room };
}

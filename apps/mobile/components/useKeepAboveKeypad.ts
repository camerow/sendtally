import React from "react";
import {
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { keypadHeight } from "./Keypad";

const CLEARANCE = 12;

export type KeepAboveKeypad = {
  scrollRef: React.RefObject<ScrollView | null>;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Scrolls just far enough that the field's bottom sits above the keypad. */
  reveal: (field: View | null) => void;
  /** Room to leave under the content while the keypad is up, so the last field can rise above it. */
  room: number;
};

/** Keeps a field opened on the in-app keypad in sight: spread `scrollRef` and `onScroll` on its scroll view. */
export function useKeepAboveKeypad(): KeepAboveKeypad {
  const scrollRef = React.useRef<ScrollView | null>(null);
  const offset = React.useRef(0);
  const { height: windowHeight } = useWindowDimensions();
  const room = keypadHeight(useSafeAreaInsets().bottom);
  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);
  const reveal = React.useCallback(
    (field: View | null): void => {
      requestAnimationFrame(() =>
        field?.measureInWindow((_x, y, _width, height) => {
          const over = y + height + CLEARANCE - (windowHeight - room);
          if (over > 0) scrollRef.current?.scrollTo({ y: offset.current + over, animated: true });
        })
      );
    },
    [windowHeight, room]
  );
  return { scrollRef, onScroll, reveal, room };
}

import React from "react";
import {
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";
import { focusedInput, onInputFocus } from "./TextInput";

export const CLEARANCE = 12;

export type KeepFocusedAboveKeys = {
  /** Spread on the scroll view that holds the inputs. */
  scrollProps: {
    ref: React.RefObject<ScrollView | null>;
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onContentSizeChange: () => void;
    onLayout: () => void;
    scrollEventThrottle: number;
  };
  scrollRef: React.RefObject<ScrollView | null>;
  /** How far the scroll view has scrolled. */
  offset: React.RefObject<number>;
};

/**
 * Scrolls the focused text input above the system keyboard, and above anything pinned under
 * the scroll view, when the keyboard comes up, when the scroll view shrinks for it, when focus
 * moves to an input below it while it is up, and when the input grows under it as it is typed
 * in; iOS does none of these by itself.
 */
export function useKeepFocusedAboveKeys(): KeepFocusedAboveKeys {
  const scrollRef = React.useRef<ScrollView | null>(null);
  const offset = React.useRef(0);
  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);
  const aboveKeys = React.useCallback(
    (keysTop: number): void =>
      scrollRef.current?.getNativeScrollRef()?.measureInWindow((_sx, top, _sw, visible) =>
        focusedInput()?.measureInWindow((_x, y, _width, height) => {
          const over = y + height + CLEARANCE - Math.min(keysTop, top + visible);
          if (over > 0) scrollRef.current?.scrollTo({ y: offset.current + over, animated: true });
        })
      ),
    []
  );
  const whileUp = React.useCallback((): void => {
    const keys = Keyboard.metrics();
    if (keys !== undefined) requestAnimationFrame(() => aboveKeys(keys.screenY));
  }, [aboveKeys]);
  React.useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (e) =>
      aboveKeys(e.endCoordinates.screenY)
    );
    const focused = onInputFocus(whileUp);
    return () => {
      shown.remove();
      focused();
    };
  }, [aboveKeys, whileUp]);
  const scrollProps = React.useMemo(
    () => ({
      ref: scrollRef,
      onScroll,
      onContentSizeChange: whileUp,
      onLayout: whileUp,
      scrollEventThrottle: 16,
    }),
    [onScroll, whileUp]
  );
  return { scrollProps, scrollRef, offset };
}

import React from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

/** Past this many points sideways the finger is swiping, not tapping or scrolling. */
const START = 24;
/** Any vertical drift this large first leaves the drag to the screen's own list. */
const VERTICAL = 14;
/** How far, or how fast, a swipe has to go to change segment. */
const DISTANCE = 64;
const SPEED = 600;

export type SegmentSwipeProps<T extends string> = {
  options: readonly { value: T }[];
  value: T;
  onChange: (value: T) => void;
  children: React.ReactNode;
};

/**
 * A sideways swipe anywhere under a page's segmented control moves to the neighbouring segment.
 * A horizontal scroller inside starts scrolling within a few points, well before this begins, so
 * it keeps its own drag.
 */
export function SegmentSwipe<T extends string>({
  options,
  value,
  onChange,
  children,
}: SegmentSwipeProps<T>): React.ReactElement {
  const pan = Gesture.Pan()
    .withTestId("segment-swipe")
    .runOnJS(true)
    .activeOffsetX([-START, START])
    .failOffsetY([-VERTICAL, VERTICAL])
    .onEnd(({ translationX, velocityX }, success) => {
      const far = Math.abs(translationX) >= DISTANCE;
      const flung =
        Math.abs(velocityX) >= SPEED && Math.sign(velocityX) === Math.sign(translationX);
      if (!success || !(far || flung)) return;
      const next =
        options[options.findIndex((o) => o.value === value) + (translationX < 0 ? 1 : -1)];
      if (next !== undefined) onChange(next.value);
    });
  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}

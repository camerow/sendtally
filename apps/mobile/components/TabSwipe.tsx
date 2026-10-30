import React from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

/** Past this many points sideways the finger is swiping, not tapping or scrolling. */
const START = 24;
/** Any vertical drift this large first leaves the drag to the screen's own list. */
const VERTICAL = 14;
/** How far, or how fast, a swipe has to go to change tab. */
const DISTANCE = 64;
const SPEED = 600;

export type TabSwipeProps = {
  /** 1 for the next tab, -1 for the one before. */
  onSwipe: (step: 1 | -1) => void;
  children: React.ReactNode;
};

/**
 * A sideways swipe anywhere on a tab moves to its neighbour. A horizontal scroller inside starts
 * scrolling within a few points, well before this begins, so it keeps its own drag.
 */
export function TabSwipe({ onSwipe, children }: TabSwipeProps): React.ReactElement {
  const pan = Gesture.Pan()
    .withTestId("tab-swipe")
    .runOnJS(true)
    .activeOffsetX([-START, START])
    .failOffsetY([-VERTICAL, VERTICAL])
    .onEnd(({ translationX, velocityX }, success) => {
      const far = Math.abs(translationX) >= DISTANCE;
      const flung =
        Math.abs(velocityX) >= SPEED && Math.sign(velocityX) === Math.sign(translationX);
      if (success && (far || flung)) onSwipe(translationX < 0 ? 1 : -1);
    });
  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}

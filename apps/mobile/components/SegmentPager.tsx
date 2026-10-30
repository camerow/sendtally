import React from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/** Past this many points sideways the finger is swiping, not tapping or scrolling. */
const START = 24;
/** Any vertical drift this large first leaves the drag to the screen's own list. */
const VERTICAL = 14;
/** How far, or how fast, a swipe has to go to change segment. */
const DISTANCE = 64;
const SPEED = 600;
/** How long a page and the segment pill take to settle. */
export const SEGMENT_MS = 220;

export type SegmentPagerProps<T extends string> = {
  options: readonly { value: T }[];
  value: T;
  onChange: (value: T) => void;
  /** The segment in view as a fractional index, for the segmented control's pill to follow. */
  progress: SharedValue<number>;
  renderPage: (value: T) => React.ReactNode;
};

/**
 * A page's segments side by side, dragged with the finger. The page in view and its neighbours
 * are mounted, so a swipe shows what it is moving to; a page stays mounted once seen.
 */
export function SegmentPager<T extends string>({
  options,
  value,
  onChange,
  progress,
  renderPage,
}: SegmentPagerProps<T>): React.ReactElement {
  const index = options.findIndex((o) => o.value === value);
  const last = options.length - 1;
  const width = useSharedValue(0);
  const near = options.filter((_, i) => Math.abs(i - index) <= 1).map((o) => o.value);
  const [mounted, setMounted] = React.useState<ReadonlySet<T>>(() => new Set(near));
  if (near.some((v) => !mounted.has(v))) setMounted(new Set([...mounted, ...near]));

  React.useEffect(() => {
    progress.set(withTiming(index, { duration: SEGMENT_MS }));
  }, [index, progress]);

  const pan = Gesture.Pan()
    .withTestId("segment-swipe")
    .activeOffsetX([-START, START])
    .failOffsetY([-VERTICAL, VERTICAL])
    .onUpdate(({ translationX }) => {
      if (width.get() === 0) return;
      const at = index - translationX / width.get();
      progress.set(at < 0 ? at / 3 : at > last ? last + (at - last) / 3 : at);
    })
    .onEnd(({ translationX, velocityX }, success) => {
      const far = Math.abs(translationX) >= DISTANCE;
      const flung =
        Math.abs(velocityX) >= SPEED && Math.sign(velocityX) === Math.sign(translationX);
      const step = success && (far || flung) ? (translationX < 0 ? 1 : -1) : 0;
      const target = Math.min(last, Math.max(0, index + step));
      progress.set(withTiming(target, { duration: SEGMENT_MS }));
      const next = options[target];
      if (target !== index && next !== undefined) scheduleOnRN(onChange, next.value);
    });

  const row = useAnimatedStyle(() => ({
    opacity: width.get() === 0 ? 0 : 1,
    transform: [{ translateX: -progress.get() * width.get() }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={{ flex: 1, overflow: "hidden" }}
        collapsable={false}
        onLayout={(e) => {
          width.set(e.nativeEvent.layout.width);
        }}
      >
        <Animated.View
          style={[{ flex: 1, flexDirection: "row", width: `${options.length * 100}%` }, row]}
        >
          {options.map((o) => {
            const away = o.value !== value;
            return (
              <View
                key={o.value}
                style={{ width: `${100 / options.length}%` }}
                accessibilityElementsHidden={away}
                importantForAccessibility={away ? "no-hide-descendants" : "auto"}
              >
                {mounted.has(o.value) ? renderPage(o.value) : null}
              </View>
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

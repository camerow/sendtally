import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { ON_DARK, ON_DARK_TRACK } from "@sendtally/features/workouts";
import { type } from "../type";
import { useAnimatedColor } from "./useAnimatedColor";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 280;
const STROKE = 14;
const RADIUS = 126;

/** Sized by length to fit inside the ring: "6" at full size, "10:00" smaller. */
const bigSize = (big: string): number => (big.length <= 2 ? 92 : big.length <= 4 ? 72 : 58);

export type TimerRingProps = {
  progress: SharedValue<number>;
  color: string;
  labelColor: string;
  phaseKey: number;
  label: string;
  big: string;
  accessibilityLabel: string;
  onPress: () => void;
  /** Width and height; the stroke and type scale with it. */
  size?: number;
};

/**
 * The countdown ring. Its sweep follows `progress` on the UI thread, its
 * colour eases between phases, and the number pops in on each new phase.
 */
export function TimerRing({
  progress,
  color,
  labelColor,
  phaseKey,
  label,
  big,
  accessibilityLabel,
  onPress,
  size = SIZE,
}: TimerRingProps): React.ReactElement {
  const k = size / SIZE;
  const radius = RADIUS * k;
  const circumference = 2 * Math.PI * radius;
  const stroke = useAnimatedColor(color);
  const ink = useAnimatedColor(labelColor);
  const pressed = useSharedValue(1);

  const arc = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    stroke: stroke.value,
  }));
  const labelStyle = useAnimatedStyle(() => ({ color: ink.value }));
  const scale = useAnimatedStyle(() => ({ transform: [{ scale: pressed.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => pressed.set(withTiming(0.97, { duration: 90 }))}
      onPressOut={() => pressed.set(withSpring(1, { damping: 12, stiffness: 260 }))}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[{ width: size, height: size }, scale]}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ON_DARK_TRACK}
            strokeWidth={STROKE * k}
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={STROKE * k}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={arc}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4 * k }}>
          <Animated.Text
            style={[
              type.label,
              { fontSize: Math.max(9, 14 * k), letterSpacing: 2.24 * k },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
          <Animated.Text
            key={phaseKey}
            entering={FadeIn.duration(220)}
            style={[
              type.monoBold,
              {
                fontSize: bigSize(big) * k,
                lineHeight: 100 * k,
                letterSpacing: -4 * k,
                color: ON_DARK,
              },
            ]}
            numberOfLines={1}
          >
            {big}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

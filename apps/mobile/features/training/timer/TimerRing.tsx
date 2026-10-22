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
import { ON_DARK, ON_DARK_MUTED, ON_DARK_TRACK } from "../components/onDark";
import { type } from "../type";
import { useAnimatedColor } from "./useAnimatedColor";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 280;
const STROKE = 14;
const RADIUS = 126;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type TimerRingProps = {
  progress: SharedValue<number>;
  color: string;
  phaseKey: number;
  label: string;
  big: string;
  hint: string;
  accessibilityLabel: string;
  onPress: () => void;
};

/**
 * The countdown ring. Its sweep follows `progress` on the UI thread, its
 * colour eases between phases, and the number pops in on each new phase.
 */
export function TimerRing({
  progress,
  color,
  phaseKey,
  label,
  big,
  hint,
  accessibilityLabel,
  onPress,
}: TimerRingProps): React.ReactElement {
  const stroke = useAnimatedColor(color);
  const pressed = useSharedValue(1);

  const arc = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    stroke: stroke.value,
  }));
  const labelColor = useAnimatedStyle(() => ({ color: stroke.value }));
  const scale = useAnimatedStyle(() => ({ transform: [{ scale: pressed.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => pressed.set(withTiming(0.97, { duration: 90 }))}
      onPressOut={() => pressed.set(withSpring(1, { damping: 12, stiffness: 260 }))}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[{ width: SIZE, height: SIZE }, scale]}>
        <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={ON_DARK_TRACK}
            strokeWidth={STROKE}
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={arc}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Animated.Text style={[type.label, { fontSize: 14, letterSpacing: 2.24 }, labelColor]}>
            {label}
          </Animated.Text>
          <Animated.Text
            key={phaseKey}
            entering={FadeIn.duration(220)}
            style={[
              type.monoBold,
              { fontSize: 92, lineHeight: 100, letterSpacing: -4, color: ON_DARK },
            ]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {big}
          </Animated.Text>
          <Animated.Text style={[type.label, { color: ON_DARK_MUTED }]}>{hint}</Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

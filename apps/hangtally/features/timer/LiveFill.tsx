import React from "react";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

/** The current progress-bar segment, filling on the UI thread. */
export function LiveFill({
  progress,
  color,
}: {
  progress: SharedValue<number>;
  color: string;
}): React.ReactElement {
  const width = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return <Animated.View style={[{ height: "100%", backgroundColor: color }, width]} />;
}

import React from "react";
import { useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";

const COLOR_MS = 320;

/** A colour that eases to each new value instead of jumping. */
export function useAnimatedColor(color: string): SharedValue<string> {
  const value = useSharedValue(color);
  React.useEffect(() => {
    value.set(withTiming(color, { duration: COLOR_MS }));
  }, [color, value]);
  return value;
}

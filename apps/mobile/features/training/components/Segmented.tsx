import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { colors } from "@sendtally/design/tokens";
import { SEGMENT_MS } from "../../../components/SegmentPager";
import { type } from "../type";

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  height?: number;
  /** A fractional index the pill follows, as a SegmentPager drags it; else it slides on change. */
  progress?: SharedValue<number>;
};

const PAD = 4;

/** A soft track with the chosen option lifted onto white. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  height = 44,
  progress,
}: SegmentedProps<T>): React.ReactElement {
  const index = options.findIndex((o) => o.value === value);
  const own = useSharedValue(index);
  React.useEffect(() => {
    own.set(withTiming(index, { duration: SEGMENT_MS }));
  }, [index, own]);
  const at = progress ?? own;
  const [inner, setInner] = React.useState(0);
  const slot = inner / options.length;
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: at.get() * slot }] }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setInner(e.nativeEvent.layout.width - PAD * 2)}
      style={{
        flexDirection: "row",
        padding: PAD,
        borderRadius: 12,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      {inner > 0 && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: PAD,
              left: PAD,
              width: slot,
              height,
              borderRadius: 9,
              backgroundColor: colors.white,
              boxShadow: "0 1px 3px rgba(64,63,76,0.18)",
            },
            pill,
          ]}
        />
      )}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              height,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on && inner === 0 ? colors.white : undefined,
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                type.bodyBold,
                { fontSize: 14, color: on ? colors.gunmetal : colors.textSecondary },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

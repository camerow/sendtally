import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { ON_DARK, ON_DARK_LINE, ON_DARK_MUTED, ON_DARK_SOFT } from "../components/onDark";
import { type } from "../type";
import { useAnimatedColor } from "./useAnimatedColor";

export type TimerControlsProps = {
  color: string;
  primary: string;
  next: string;
  fail: string | null;
  onPrimary: () => void;
  onFail: () => void;
  onRestart: () => void;
  onSkip: () => void;
};

/** Came off early / missed lift, what comes next, and restart · primary · skip. */
export function TimerControls({
  color,
  primary,
  next,
  fail,
  onPrimary,
  onFail,
  onRestart,
  onSkip,
}: TimerControlsProps): React.ReactElement {
  const fill = useAnimatedColor(color);
  const primaryStyle = useAnimatedStyle(() => ({ backgroundColor: fill.value }));
  return (
    <View style={{ gap: 18 }}>
      {fail !== null && <Button label={fail} onPress={onFail} variant="outlineDark" height={48} />}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingHorizontal: 2,
        }}
      >
        <Label color={ON_DARK_MUTED}>{t("hang.next")}</Label>
        <Text style={[type.body, { fontSize: 14, color: ON_DARK_SOFT }]}>{next}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <IconButton
          icon="restart"
          label={t("hang.restartInterval")}
          onPress={onRestart}
          color={ON_DARK}
          border={ON_DARK_LINE}
          size={56}
          iconSize={22}
        />
        <Pressable onPress={onPrimary} accessibilityRole="button" style={{ flex: 1 }}>
          {({ pressed }) => (
            <Animated.View
              style={[
                {
                  height: 56,
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                },
                primaryStyle,
              ]}
            >
              <Text style={[type.bodyBold, { fontSize: 16, color: colors.gunmetal }]}>
                {primary}
              </Text>
            </Animated.View>
          )}
        </Pressable>
        <IconButton
          icon="skip"
          label={t("hang.skipInterval")}
          onPress={onSkip}
          color={ON_DARK}
          border={ON_DARK_LINE}
          size={56}
          iconSize={22}
        />
      </View>
    </View>
  );
}

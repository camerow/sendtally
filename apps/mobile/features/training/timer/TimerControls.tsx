import React from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { currentPhase, hasNextSet, type Phase } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { ON_DARK, ON_DARK_LINE } from "@sendtally/features/workouts";
import { HangIcon } from "../components/HangIcon";
import { IconButton } from "../components/IconButton";
import { useAnimatedColor } from "./useAnimatedColor";
import type { Timer } from "./useTimer";

export type TimerControlsProps<P extends Phase> = {
  timer: Timer<P>;
  color: string;
  /** What the round button does: Pause, Resume, or Lifted on a lift. */
  primary: string;
};

/** One row: set back, restart, a round pause, play or lift button in the phase's colour, skip, set forward. */
export function TimerControls<P extends Phase>({
  timer,
  color,
  primary,
}: TimerControlsProps<P>): React.ReactElement {
  const fill = useAnimatedColor(color);
  const primaryStyle = useAnimatedStyle(() => ({ backgroundColor: fill.value }));
  const icon =
    currentPhase(timer.run).taps > 0 ? "check" : timer.run.pausedAt === null ? "pause" : "play";
  const round = { color: ON_DARK, border: ON_DARK_LINE, iconSize: 18 };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <IconButton
        icon="back"
        label={t("hang.previousSet")}
        onPress={timer.previousSet}
        disabled={timer.run.index === 0}
        {...round}
      />
      <IconButton
        icon="restart"
        label={t("hang.restartInterval")}
        onPress={timer.restart}
        {...round}
        iconSize={22}
      />
      <Pressable onPress={timer.primary} accessibilityRole="button" accessibilityLabel={primary}>
        {({ pressed }) => (
          <Animated.View
            style={[
              {
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
              },
              primaryStyle,
            ]}
          >
            <HangIcon name={icon} color={colors.gunmetal} size={26} strokeWidth={3} />
          </Animated.View>
        )}
      </Pressable>
      <IconButton
        icon="skip"
        label={t("hang.skipInterval")}
        onPress={timer.skip}
        {...round}
        iconSize={22}
      />
      <IconButton
        icon="forward"
        label={t("hang.nextSet")}
        onPress={timer.nextSet}
        disabled={!hasNextSet(timer.run)}
        {...round}
      />
    </View>
  );
}

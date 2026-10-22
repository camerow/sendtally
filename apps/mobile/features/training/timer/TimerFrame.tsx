import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import type { Phase } from "@sendtally/core/hang";
import { RunProgressBar } from "./RunProgressBar";
import { TimerControls, type TimerControlsProps } from "./TimerControls";
import { TimerHeader } from "./TimerHeader";
import type { Timer } from "./useTimer";

export type TimerFrameProps<P extends Phase> = {
  timer: Timer<P>;
  name: string;
  meta: string;
  controls: Omit<TimerControlsProps, "onRestart" | "onSkip">;
  children: React.ReactNode;
};

/** The dark timer screen: End, name and mute, the run's phase bar, the screen's own middle, and the controls. */
export function TimerFrame<P extends Phase>({
  timer,
  name,
  meta,
  controls,
  children,
}: TimerFrameProps<P>): React.ReactElement {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.gunmetal }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, gap: 18, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 }}>
        <TimerHeader
          name={name}
          meta={meta}
          muted={timer.muted}
          onEnd={timer.end}
          onToggleMute={timer.toggleMute}
        />
        <RunProgressBar run={timer.run} progress={timer.progress} />
        {children}
        <TimerControls {...controls} onRestart={timer.restart} onSkip={timer.skip} />
      </View>
    </SafeAreaView>
  );
}

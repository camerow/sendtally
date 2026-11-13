import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { stripVM } from "@sendtally/features/workouts";
import { useHold } from "../training/hold/useHold";
import { useRestLeft } from "../training/rest/useRest";
import { useLiveRun } from "./liveRun";

const text = { fontFamily: fonts.monoSemiBold, fontSize: 11.5, color: colors.white };

/**
 * The live run's rest or timed set while its player is minimised: a slim line under the live
 * bar, gold draining for a rest, green filling for a hold.
 */
export function RestStrip(): React.ReactElement | null {
  const rest = useLiveRun()?.rest ?? null;
  const left = useRestLeft(rest);
  const { hold, now } = useHold();
  const vm = stripVM(rest, left, hold, now);
  if (vm === null) return null;
  return (
    <Strip
      share={vm.share}
      fill={vm.kind === "rest" ? colors.gold : colors.fern}
      {...(vm.label !== null && { label: vm.label })}
    >
      <Text style={text}>{vm.text}</Text>
      {vm.then !== null && (
        <Text style={[text, { fontFamily: fonts.mono, color: "rgba(255,255,255,0.7)" }]}>
          {vm.then}
        </Text>
      )}
    </Strip>
  );
}

function Strip({
  share,
  fill,
  label,
  children,
}: {
  share: number;
  fill: string;
  label?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View
      {...(label !== undefined && { accessibilityLabel: label })}
      style={{
        height: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        overflow: "hidden",
        backgroundColor: colors.gunmetalDeep,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${share * 100}%`,
          backgroundColor: fill,
          opacity: fill === colors.gold ? 0.32 : 0.55,
        }}
      />
      {children}
    </View>
  );
}

import { router } from "expo-router";
import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { t } from "@sendtally/features/i18n";
import { press } from "../lib/press";
import { Icon } from "./Icon";

/** The row every live screen's header sits in: Minimise first, then its middle and its ending. */
export const LIVE_HEADER = {
  height: 52,
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingLeft: 7,
  paddingRight: 10,
} satisfies ViewStyle;

/** Leaves a live screen for the one under it, or the tabs when it was opened on its own. */
export function leaveLiveScreen(): void {
  if (router.canGoBack()) router.back();
  else router.replace("/(tabs)/sessions");
}

/** A chevron pointing down, which slides a live screen into the live bar with its run going on. */
export function MinimiseButton({ color }: { color: string }): React.ReactElement {
  return (
    <Pressable
      onPress={leaveLiveScreen}
      accessibilityRole="button"
      accessibilityLabel={t("tally.minimise")}
      style={press({ width: 44, height: 44, alignItems: "center", justifyContent: "center" })}
    >
      <View style={{ transform: [{ rotate: "90deg" }] }}>
        <Icon name="chevron" color={color} size={22} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

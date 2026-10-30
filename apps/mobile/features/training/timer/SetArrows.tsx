import React from "react";
import { Pressable, Text, View } from "react-native";
import { hasNextSet, type Phase } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { ON_DARK } from "../components/onDark";
import { type } from "../type";
import type { Timer } from "./useTimer";

export type SetArrowsProps<P extends Phase> = { timer: Timer<P>; label: string };

function Arrow({
  icon,
  label,
  enabled,
  onPress,
}: {
  icon: "back" | "forward";
  label: string;
  enabled: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={4}
      style={press({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
        opacity: enabled ? 1 : 0.35,
      })}
    >
      <HangIcon name={icon} color={ON_DARK} size={20} strokeWidth={2.4} />
    </Pressable>
  );
}

/** ‹ Set 2 of 5 ›: back replays a set, taking back what it logged; forward skips to the next. */
export function SetArrows<P extends Phase>({
  timer,
  label,
}: SetArrowsProps<P>): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <Arrow
        icon="back"
        label={t("hang.previousSet")}
        enabled={timer.run.index > 0}
        onPress={timer.previousSet}
      />
      <Text
        style={[
          type.monoBold,
          { minWidth: 150, fontSize: 14, textAlign: "center", color: ON_DARK },
        ]}
      >
        {label}
      </Text>
      <Arrow
        icon="forward"
        label={t("hang.nextSet")}
        enabled={hasNextSet(timer.run)}
        onPress={timer.nextSet}
      />
    </View>
  );
}

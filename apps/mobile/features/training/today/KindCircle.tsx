import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { WorkoutKind } from "@sendtally/core/hang";
import { Icon } from "../../../components/Icon";
import { HangIcon } from "../components/HangIcon";
import { DayMark } from "./DayMark";
import { KIND_LOOK } from "@sendtally/features/training";

export type KindCircleProps = {
  kind: WorkoutKind;
  /** How it went: a check once done, a cross once missed. */
  badge: "done" | "missed";
};

const BADGE = {
  done: { icon: "check", ground: colors.fern },
  missed: { icon: "x", ground: colors.watermelon },
} as const;

/** A day item's kind as a tinted circle, with how it went on its corner. */
export function KindCircle({ kind, badge }: KindCircleProps): React.ReactElement {
  const look = KIND_LOOK[kind];
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: look.tint,
      }}
    >
      {kind === "climbing" || kind === "hangboard" ? (
        <Icon
          name={kind === "climbing" ? "climb" : "hang"}
          color={look.ink}
          size={20}
          strokeWidth={1.9}
        />
      ) : (
        <DayMark kind={kind} filled scale={1.5} />
      )}
      <View
        style={{
          position: "absolute",
          right: -5,
          bottom: -5,
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: colors.white,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BADGE[badge].ground,
        }}
      >
        <HangIcon name={BADGE[badge].icon} color={colors.white} size={12} strokeWidth={3} />
      </View>
    </View>
  );
}

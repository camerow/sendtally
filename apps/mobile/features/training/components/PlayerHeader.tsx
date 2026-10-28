import React from "react";
import { View } from "react-native";
import type { ActivityKind } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { durationLabel } from "@sendtally/features/sessions";
import { BackButton } from "../../../components/BackButton";
import { LiveClock } from "../../../components/LiveClock";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { Label } from "./Label";
import { Title } from "./Title";
import { WorkoutNotes } from "./WorkoutNotes";

export type PlayerHeaderProps = {
  kind: ActivityKind;
  title: string;
  minutes: number | null;
  workoutId: string;
  /** When the player started, which its clock counts from. */
  startedAt: number;
};

/**
 * Back and the clock from Start, then the workout's kind and length, its name and notes: the
 * top of the sets and checklist players.
 */
export function PlayerHeader({
  kind,
  title,
  minutes,
  workoutId,
  startedAt,
}: PlayerHeaderProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <BackButton />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.fern }} />
          <LiveClock
            elapsed={(now) => Math.max(0, Math.floor((now.getTime() - startedAt) / 1000))}
            style={[type.monoBold, { fontSize: 17, color: colors.gunmetal }]}
          />
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Label color={KIND_LOOK[kind].ink}>
          {[kindLabel(kind), minutes === null ? null : durationLabel(minutes)]
            .filter((p) => p !== null)
            .join(" · ")}
        </Label>
        <Title size={32}>{title}</Title>
        <WorkoutNotes workoutId={workoutId} />
      </View>
    </View>
  );
}

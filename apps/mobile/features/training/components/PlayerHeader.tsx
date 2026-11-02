import React from "react";
import { View } from "react-native";
import type { ActivityKind } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { LiveClock } from "../../../components/LiveClock";
import { LIVE_HEADER, MinimiseButton } from "../../../components/MinimiseButton";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { Label } from "./Label";
import { Title } from "./Title";
import { WorkoutInfo } from "./WorkoutInfo";
import { WorkoutNotes } from "./WorkoutNotes";

export type PlayerHeaderProps = {
  kind: ActivityKind;
  title: string;
  workoutId: string;
  /** When the player started, which its clock counts from. */
  startedAt: number;
};

/**
 * Minimise and the clock from Start, then the workout's kind, its name with its description
 * behind an info button, and its target effort: the top of the sets and checklist players.
 */
export function PlayerHeader({
  kind,
  title,
  workoutId,
  startedAt,
}: PlayerHeaderProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View style={[LIVE_HEADER, { marginHorizontal: -18, justifyContent: "space-between" }]}>
        <MinimiseButton color={colors.gunmetal} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.fern }} />
          <LiveClock
            elapsed={(now) => Math.max(0, Math.floor((now.getTime() - startedAt) / 1000))}
            style={[type.monoBold, { fontSize: 17, color: colors.gunmetal }]}
          />
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Label color={KIND_LOOK[kind].ink}>{kindLabel(kind)}</Label>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Title size={32} style={{ flexShrink: 1 }}>
            {title}
          </Title>
          <WorkoutInfo workoutId={workoutId} color={colors.textMuted} />
        </View>
        <WorkoutNotes workoutId={workoutId} />
      </View>
    </View>
  );
}

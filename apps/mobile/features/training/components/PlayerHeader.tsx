import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ActivityKind } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { Icon } from "../../../components/Icon";
import { LiveClock } from "../../../components/LiveClock";
import { press } from "../../../lib/press";
import { LIVE_HEADER, MinimiseButton } from "../../../components/MinimiseButton";
import { KIND_LOOK } from "@sendtally/features/training";
import { type } from "../type";
import { Label } from "./Label";
import { Title } from "./Title";
import { t } from "@sendtally/features/i18n";
import { gymLine } from "@sendtally/features/workouts";
import { useRunWorkout } from "../library/useLibrary";
import { Description } from "./Description";

export type PlayerHeaderProps = {
  kind: ActivityKind;
  title: string;
  workoutId: string;
  /** When the player started, which its clock counts from. */
  startedAt: number;
  /** Where the run is: "Exercise 2 of 3". */
  position?: { at: number; of: number } | null;
  /** The workout has no exercises, so its description is the body and opens unfolded. */
  bare?: boolean;
  /** Where a workout with climbing in it is climbed: "At Crux ⌄" or "No gym ⌄", which picks another. */
  gym?: { name: string | undefined; onPick: () => void } | undefined;
};

/**
 * Minimise and the clock from Start, then the workout's kind, its name, where the run is and
 * its target effort, and its description folded to three lines: the top of the sets and
 * checklist players.
 */
export function PlayerHeader({
  kind,
  title,
  workoutId,
  startedAt,
  position = null,
  bare = false,
  gym,
}: PlayerHeaderProps): React.ReactElement {
  const workout = useRunWorkout(workoutId);
  const line = [
    position !== null && t("workouts.exerciseOf", { n: position.at, of: position.of }),
    workout?.targetRpe != null && t("plan.targetValue", { n: workout.targetRpe }),
  ].filter((part) => part !== false);
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
        <Title size={32}>{title}</Title>
        {(line.length > 0 || gym !== undefined) && (
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
            <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
              {[...line, ...(gym === undefined ? [] : [""])].join(" · ")}
            </Text>
            {gym !== undefined && (
              <Pressable
                onPress={gym.onPick}
                accessibilityRole="button"
                accessibilityLabel={`${t("gyms.gym")}, ${gym.name ?? t("gyms.noGym")}`}
                hitSlop={{ top: 12, bottom: 12 }}
                style={press({ flexDirection: "row", alignItems: "center", gap: 2 })}
              >
                <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                  {gymLine(gym.name)}
                </Text>
                <View style={{ transform: [{ rotate: "90deg" }] }}>
                  <Icon name="chevron" size={12} strokeWidth={2} color={colors.textSecondary} />
                </View>
              </Pressable>
            )}
          </View>
        )}
      </View>
      {workout !== undefined && (
        <Description key={workoutId} text={workout.description} fold={3} startOpen={bare} />
      )}
    </View>
  );
}

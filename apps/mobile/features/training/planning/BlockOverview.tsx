import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { Plan } from "@sendtally/api-client";
import { blockWeekOn } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { blockMembers, type BlockRecap, type WorkoutLookup } from "@sendtally/features/training";
import { BlockWeekChips } from "../blocks/BlockWeekChips";
import { doneOfShort, effortText } from "../blocks/blockText";
import { DashedPanel } from "../components/DashedPanel";
import { PlanRow } from "../components/PlanRow";
import { useHangData } from "../data/HangDataContext";
import { membershipWhen } from "../plans/planText";
import { SummaryTiles } from "../summary/SummaryTiles";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";

export type BlockOverviewProps = {
  recap: BlockRecap;
  plan: Plan;
  workout: WorkoutLookup;
  /** A plan just added, lit for a moment. */
  lit?: string;
};

/** A block before it ends: its weeks, how this week and the block are going, and its workouts. */
export function BlockOverview({
  recap,
  plan,
  workout,
  lit,
}: BlockOverviewProps): React.ReactElement {
  const { today } = useHangData();
  const { block } = recap;
  const week = recap.weeks[(blockWeekOn(block, today) ?? 0) - 1];
  const members = blockMembers(plan, block);
  return (
    <>
      <BlockWeekChips block={block} today={today} />
      {week !== undefined && (
        <SummaryTiles
          stats={[
            { value: doneOfShort(week), label: t("hang.weekThis") },
            { value: doneOfShort(recap.soFar), label: t("plan.soFar") },
            { value: effortText(recap.effort), label: t("hang.statAvgEffort") },
          ]}
        />
      )}
      {members.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <View style={{ gap: 8 }}>
          {members.map((m) => {
            const w = workout(m.workoutId);
            if (w === undefined) return null;
            return (
              <PlanRow
                key={m.id}
                mark={<DayMark kind={w.kind} filled />}
                tag={kindLabel(w.kind)}
                tagColor={KIND_LOOK[w.kind].ink}
                name={w.name}
                meta={membershipWhen(m)}
                onOpen={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } })}
                lit={m.id === lit}
              />
            );
          })}
        </View>
      )}
    </>
  );
}

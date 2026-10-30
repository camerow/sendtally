import React from "react";
import type { Plan } from "@sendtally/api-client";
import { blockWeekOn } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockMembers, type BlockRecap, type WorkoutLookup } from "@sendtally/features/training";
import { BlockWeekChips } from "../blocks/BlockWeekChips";
import { doneOfShort, effortText } from "../blocks/blockText";
import { useHangData } from "../data/HangDataContext";
import { SummaryTiles } from "../summary/SummaryTiles";
import { BlockWeek } from "./BlockWeek";

export type BlockOverviewProps = {
  recap: BlockRecap;
  plan: Plan;
  workout: WorkoutLookup;
  /** A plan just added, lit for a moment. */
  lit?: string;
};

/** A block before it ends: its weeks, how this week and the block are going, and its week. */
export function BlockOverview({
  recap,
  plan,
  workout,
  lit,
}: BlockOverviewProps): React.ReactElement {
  const { today } = useHangData();
  const { block } = recap;
  const week = recap.weeks[(blockWeekOn(block, today) ?? 0) - 1];
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
      <BlockWeek block={block} members={blockMembers(plan, block)} workout={workout} lit={lit} />
    </>
  );
}

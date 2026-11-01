import React from "react";
import type { Plan } from "@sendtally/api-client";
import { blockWeekOn } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockMembers, type BlockRecap, type WorkoutLookup } from "@sendtally/features/training";
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
  /** The week its chips picked, this week when it opened. */
  week: number;
};

/** A block before it ends: how the picked week and the block are going, and that week. */
export function BlockOverview({
  recap,
  plan,
  workout,
  lit,
  week,
}: BlockOverviewProps): React.ReactElement {
  const { today } = useHangData();
  const { block } = recap;
  const picked = recap.weeks[week - 1];
  const current = blockWeekOn(block, today);
  return (
    <>
      {current !== null && picked !== undefined && (
        <SummaryTiles
          stats={[
            {
              value: doneOfShort(picked),
              label: week === current ? t("hang.weekThis") : t("plan.weekNumber", { n: week }),
            },
            { value: doneOfShort(recap.soFar), label: t("plan.soFar") },
            { value: effortText(recap.effort), label: t("hang.statAvgEffort") },
          ]}
        />
      )}
      <BlockWeek
        block={block}
        members={blockMembers(plan, block)}
        workout={workout}
        lit={lit}
        week={week}
      />
    </>
  );
}

import React from "react";
import type { Plan } from "@sendtally/api-client";
import { blockWeekOn } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockMembers,
  doneOfShort,
  effortText,
  type BlockRecap,
  type DaySchedule,
  type DayToggle,
  type WorkoutLookup,
} from "@sendtally/features/training";
import { SummaryTiles } from "../../components/detail/SummaryTiles";
import { useHangData } from "../data/HangDataContext";
import { BlockWeek } from "./BlockWeek";

export type BlockOverviewProps = {
  recap: BlockRecap;
  /** The plan with any draft applied. */
  plan: Plan;
  workout: WorkoutLookup;
  /** The week its chips picked, this week when it opened. */
  week: number;
  editing: boolean;
  onToggle: (membershipId: string, change: DayToggle) => void;
  onSchedules: (schedules: readonly DaySchedule[]) => void;
  onPickWeek: (week: number) => void;
  onEditDays?: () => void;
  onMove: (membershipId: string, by: -1 | 1) => void;
};

/** A block before it ends: how the picked week and the block are going, and that week. */
export function BlockOverview({
  recap,
  plan,
  workout,
  week,
  ...edit
}: BlockOverviewProps): React.ReactElement {
  const { today } = useHangData();
  const block = plan.blocks.find((b) => b.id === recap.block.id) ?? recap.block;
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
        week={week}
        plan={plan}
        {...edit}
      />
    </>
  );
}

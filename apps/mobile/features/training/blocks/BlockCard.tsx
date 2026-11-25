import React from "react";
import { useExerciseList } from "@sendtally/features/exercises";
import { useApi } from "../../../lib/api";
import type { DatedBlock, Membership } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  type WorkoutLookup,
  planGridRows,
  blockDateRange,
  blockName,
} from "@sendtally/features/training";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { openMembership } from "../plan/openMembership";
import type { RowPress } from "../useLockedRows";
import { PlanCard } from "./PlanCard";

export type BlockCardProps = {
  block: DatedBlock;
  members: readonly Membership[];
  workout: WorkoutLookup;
  /** How its title presses: open the block, or locked, and so its plans too. */
  press: RowPress;
};

/** A training block: where it is and what is in it. Tap to open it. */
export function BlockCard({ block, members, workout, press }: BlockCardProps): React.ReactElement {
  const { model } = useHangData();
  const exercises = useExerciseList(useApi());
  const rows = planGridRows(members, workout, model, {
    exercises,
    open: (m) => (press.locked === true ? press.onPress() : openMembership(m, t("training.train"))),
  });
  return (
    <PlanCard
      title={blockName(block)}
      subtitle={blockDateRange(block)}
      open={{ label: t("plan.openBlock", { name: blockName(block) }), onPress: press.onPress }}
      locked={press.locked}
      hold={press.hold}
    >
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid rows={rows} framed={false} />
      )}
    </PlanCard>
  );
}

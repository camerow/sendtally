import React from "react";
import { useExerciseList } from "@sendtally/features/exercises";
import { useAppApi } from "../../lib/useAppApi";
import { useNavigate } from "react-router";
import type { DatedBlock, Membership } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockDateRange,
  planGridRows,
  type WorkoutLookup,
  blockName,
} from "@sendtally/features/training";
import { DashedPanel } from "../components/DashedPanel";
import { PlanGrid } from "../components/PlanGrid";
import { useHangData } from "../data/HangDataContext";
import type { RowLink } from "../useLockedRows";
import { PlanCard } from "./PlanCard";
import { membershipPath } from "./paths";

export type BlockCardProps = {
  block: DatedBlock;
  members: readonly Membership[];
  workout: WorkoutLookup;
  /** Where its title goes: the block, or locked, the Membership page, and so do its plans. */
  link: RowLink;
};

/** A training block: where it is and what is in it. Its title opens it. */
export function BlockCard({ block, members, workout, link }: BlockCardProps): React.ReactElement {
  const { model } = useHangData();
  const exercises = useExerciseList(useAppApi());
  const navigate = useNavigate();
  const rows = planGridRows(members, workout, model, {
    exercises,
    open: (m) => void navigate(link.locked === true ? link.to : membershipPath(m)),
  });
  return (
    <PlanCard
      title={blockName(block)}
      subtitle={blockDateRange(block)}
      open={{ label: t("plan.openBlock", { name: blockName(block) }), to: link.to }}
      locked={link.locked}
      menu={link.menu}
    >
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid rows={rows} framed={false} />
      )}
    </PlanCard>
  );
}

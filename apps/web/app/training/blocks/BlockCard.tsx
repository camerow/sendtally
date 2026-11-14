import React from "react";
import { useNavigate } from "react-router";
import type { DatedBlock, Membership } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockDateRange, planGridRows, type WorkoutLookup } from "@sendtally/features/training";
import { DashedPanel } from "../components/DashedPanel";
import { PlanGrid } from "../components/PlanGrid";
import { useHangData } from "../data/HangDataContext";
import { PlanCard } from "./PlanCard";
import { blockPath, membershipPath } from "./paths";

export type BlockCardProps = {
  block: DatedBlock;
  members: readonly Membership[];
  workout: WorkoutLookup;
};

/** A training block: where it is and what is in it. Its title opens it. */
export function BlockCard({ block, members, workout }: BlockCardProps): React.ReactElement {
  const { model } = useHangData();
  const navigate = useNavigate();
  const rows = planGridRows(members, workout, model, {
    open: (m) => void navigate(membershipPath(m)),
  });
  return (
    <PlanCard
      title={block.name}
      subtitle={blockDateRange(block)}
      open={{ label: t("plan.openBlock", { name: block.name }), to: blockPath(block.id) }}
    >
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid rows={rows} framed={false} />
      )}
    </PlanCard>
  );
}

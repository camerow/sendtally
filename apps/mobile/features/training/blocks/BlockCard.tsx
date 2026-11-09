import React from "react";
import type { DatedBlock, Membership } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { WorkoutLookup } from "@sendtally/features/training";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { blockDateRange } from "./blockText";
import { openBlock } from "./openBlock";
import { PlanCard } from "./PlanCard";

export type BlockCardProps = {
  block: DatedBlock;
  members: readonly Membership[];
  workout: WorkoutLookup;
};

/** A training block: where it is and what is in it. Tap to open it. */
export function BlockCard({ block, members, workout }: BlockCardProps): React.ReactElement {
  const { model } = useHangData();
  const rows = planGridRows(members, workout, model, { back: t("training.train") });
  return (
    <PlanCard
      title={block.name}
      dates={blockDateRange(block)}
      open={{
        label: t("plan.openBlock", { name: block.name }),
        onPress: () => openBlock(block.id, t("training.train")),
      }}
    >
      {rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid rows={rows} framed={false} />
      )}
    </PlanCard>
  );
}

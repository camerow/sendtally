import React from "react";
import type { Block } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockGroups, pastMeta, templateMeta, useTrainingLog } from "@sendtally/features/training";
import { useAppApi } from "../../lib/useAppApi";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { BlockRow } from "./BlockRow";

export type ScheduleBlocksProps = { onPick: (block: Block) => void };

/** What can be scheduled as a block: templates, and past blocks to run again. Running and upcoming ones already are. */
export function ScheduleBlocks({ onPick }: ScheduleBlocksProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const { templates, past } = blockGroups(log.plan.blocks, today);
  const groups = [
    {
      label: t("plan.templates"),
      rows: templates.map((block) => ({ block, meta: templateMeta(log, block) })),
    },
    {
      label: t("plan.completed"),
      rows: past.map((block) => ({ block, meta: pastMeta(log, block, today) })),
    },
  ].filter((g) => g.rows.length > 0);
  if (groups.length === 0) return <DashedPanel body={t("plan.noBlocksToSchedule")} />;
  return (
    <div className="schedule-blocks">
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="plan-label plan-label--muted">{g.label}</h3>
          {g.rows.map(({ block, meta }) => (
            <BlockRow
              key={block.id}
              id={block.id}
              name={block.name || t("plan.untitled")}
              meta={meta}
              onPress={() => onPick(block)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

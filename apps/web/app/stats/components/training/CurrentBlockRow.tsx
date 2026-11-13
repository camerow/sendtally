import React from "react";
import { Link } from "react-router";
import { blockWeekOn } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockDone, blockGroups, useTrainingLog } from "@sendtally/features/training";
import { useAppApi } from "../../../lib/useAppApi";
import { blockPath } from "../../../training/blocks/paths";
import { useHangData } from "../../../training/data/HangDataContext";

/** The block running today, how far in and how much of it is done, opening it; nothing outside a block. */
export function CurrentBlockRow(): React.ReactElement | null {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const block = blockGroups(log.plan.blocks, today).current[0];
  if (block === undefined) return null;
  const done = blockDone(log, block, today);
  const meta = [
    t("plan.blockWeek", { at: blockWeekOn(block, today) ?? 1, of: block.weeks }),
    ...(done.planned > 0 ? [t("plan.doneOf", done)] : []),
  ].join(" · ");
  return (
    <Link to={blockPath(block.id)} className="current-block" aria-label={`${block.name}, ${meta}`}>
      <span className="current-block-name">{block.name}</span>
      <span className="stats-meta">{meta}</span>
    </Link>
  );
}

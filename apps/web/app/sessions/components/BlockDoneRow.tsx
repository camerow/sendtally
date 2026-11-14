import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import type { BlockRecap } from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { blockPath } from "../../training/blocks/paths";
import { BlockWeekBars } from "../../training/components/BlockWeekBars";

/** A block finished, on its last day in the log: its name, what got done, and a bar per week. */
export function BlockDoneRow({ recap }: { recap: BlockRecap }): React.ReactElement {
  const { block } = recap;
  const meta = [
    t("calendar.weeks", { count: block.weeks }),
    t("plan.doneOf", { done: recap.done, planned: recap.planned }),
  ].join(" · ");
  return (
    <Link
      to={blockPath(block.id)}
      className="block-done"
      aria-label={`${t("plan.blockFinished")}, ${block.name}, ${meta}`}
    >
      <span className="block-done-badge">
        <Icon name="projects" size={18} strokeWidth={2} />
      </span>
      <span className="block-done-text">
        <span className="block-done-kicker">{t("plan.blockFinished")}</span>
        <span className="block-done-name">{block.name}</span>
        <span className="block-done-meta">{meta}</span>
      </span>
      <BlockWeekBars weeks={recap.weeks} compact />
    </Link>
  );
}

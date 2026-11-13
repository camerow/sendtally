import React from "react";
import type { NewBestVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

/** A session that beat its grip's best on the same setup: gunmetal with a gold glow and star. */
export function NewBestCard({ best }: { best: NewBestVM }): React.ReactElement {
  return (
    <div
      className="new-best"
      role="group"
      aria-label={`${t("hang.newBest")}, ${best.title}, ${best.meta}`}
    >
      <span className="new-best-star">
        <Icon name="star" size={18} strokeWidth={2} />
      </span>
      <span className="new-best-text">
        <span className="train-label train-label--small new-best-kicker">{t("hang.newBest")}</span>
        <span className="new-best-title">{best.title}</span>
        <span className="new-best-meta">{best.meta}</span>
      </span>
    </div>
  );
}

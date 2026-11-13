import React from "react";
import type { MilestoneVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

/** A grip's milestones, each a gold star in a gunmetal circle with what happened and when. */
export function Milestones({ rows }: { rows: readonly MilestoneVM[] }): React.ReactElement | null {
  if (rows.length === 0) return null;
  return (
    <div className="milestones">
      <h2 className="detail-label">{t("hang.milestones")}</h2>
      {rows.map((m) => (
        <div key={m.key} className="milestone">
          <span className="milestone-star">
            <Icon name="star" size={15} strokeWidth={2} />
          </span>
          <span className="milestone-text">
            <span className="milestone-what">{m.text}</span>
            <span className="milestone-when">{m.meta}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

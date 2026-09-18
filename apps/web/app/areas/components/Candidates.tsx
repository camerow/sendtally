import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";

export type Candidate = { id: string; name: string; to: string; meta: string };

/** Look-alikes the server found: open one if it is the same place, or save again to say it is new. */
export function Candidates({ candidates }: { candidates: Candidate[] }): React.ReactElement {
  return (
    <div className="area-candidates" role="status">
      <span className="area-candidates-title">{t("areas.isItOneOfThese")}</span>
      <span className="area-candidates-hint">{t("areas.isItOneOfTheseHint")}</span>
      {candidates.map((c) => (
        <Link key={c.id} to={c.to} className="area-candidate">
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{c.name}</span>
          <span className="project-meta" style={{ flexShrink: 0 }}>
            {c.meta}
          </span>
        </Link>
      ))}
    </div>
  );
}

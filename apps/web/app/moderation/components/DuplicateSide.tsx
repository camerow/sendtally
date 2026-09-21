import React from "react";
import { Link } from "react-router";
import type { DuplicateItem } from "@sendtally/api-client";
import { areaClimbGradeLabel, climbTypeLabel } from "@sendtally/features/areas";

export function DuplicateSide({
  label,
  climb,
}: {
  label: string;
  climb: DuplicateItem["keep"];
}): React.ReactElement {
  return (
    <div className="mod-side">
      <span className="mod-label">{label}</span>
      {climb === null ? (
        <span className="mod-muted">No longer live</span>
      ) : (
        <>
          <Link to={`/app/climbs/${climb.slug}`} className="mod-title">
            {climb.name}
          </Link>
          <span className="area-meta">
            {`${climbTypeLabel(climb.type)} · ${areaClimbGradeLabel(climb)}`}
          </span>
          <span className="mod-muted">
            {`${climb.links} linked session${climb.links === 1 ? "" : "s"}`}
          </span>
        </>
      )}
    </div>
  );
}

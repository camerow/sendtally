import React from "react";
import { Link } from "react-router";
import type { DuplicateItem } from "@sendtally/api-client";
import { areaClimbGradeLabel, climbTypeLabel } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";

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
        <span className="mod-muted">{t("moderation.noLongerLive")}</span>
      ) : (
        <>
          <Link to={`/app/climbs/${climb.slug}`} className="mod-title">
            {climb.name}
          </Link>
          <span className="area-meta">
            {`${climbTypeLabel(climb.type)} · ${areaClimbGradeLabel(climb)}`}
          </span>
          <span className="mod-muted">
            {t("moderation.linkedSessions", { count: climb.links })}
          </span>
        </>
      )}
    </div>
  );
}

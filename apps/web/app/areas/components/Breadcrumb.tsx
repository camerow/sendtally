import React from "react";
import { Link } from "react-router";
import { breadcrumbOf, type AreaSummary } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";

export function Breadcrumb({ ancestors }: { ancestors: AreaSummary[] }): React.ReactElement {
  return (
    <nav className="area-crumbs" aria-label={t("areas.breadcrumb")}>
      {breadcrumbOf(ancestors).map((area, i) => (
        <React.Fragment key={area.id}>
          {i > 0 && <span aria-hidden>/</span>}
          <Link to={`/app/areas/${area.slug}`}>{area.name}</Link>
        </React.Fragment>
      ))}
    </nav>
  );
}

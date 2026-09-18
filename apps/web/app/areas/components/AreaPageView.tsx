import React from "react";
import { Link } from "react-router";
import { Button } from "@sendtally/design";
import type { SendtallyApi } from "@sendtally/api-client";
import {
  areaClimbGradeLabel,
  climbTypeLabel,
  isPending,
  type AreaPage,
} from "@sendtally/features/areas";
import { formatNumber, t } from "@sendtally/features/i18n";
import { AreaFormDialog } from "./AreaFormDialog";
import { AreaMenu } from "./AreaMenu";
import { Breadcrumb } from "./Breadcrumb";
import { ClimbFormDialog } from "./ClimbFormDialog";
import { Notice } from "./Notice";
import { PendingBadge } from "./PendingBadge";
import { ReportIssueDialog } from "./ReportIssueDialog";

type Dialog = "suggest" | "subArea" | "climb" | "report" | null;

const coordinate = (n: number): string => formatNumber(n, { maximumFractionDigits: 4 });

export function AreaPageView({
  api,
  page,
}: {
  api: SendtallyApi;
  page: AreaPage;
}): React.ReactElement {
  const { area, ancestors, children, climbs } = page;
  const [dialog, setDialog] = React.useState<Dialog>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const region = area.region_code !== null;
  const close = React.useCallback(() => setDialog(null), []);
  const done = (message: string) => (): void => {
    setDialog(null);
    setNotice(message);
  };

  const meta = [
    region ? t("areas.region") : null,
    area.lat !== null && area.lon !== null
      ? `${coordinate(area.lat)}, ${coordinate(area.lon)}`
      : null,
    children.length > 0 || region ? t("areas.areaCount", { count: children.length }) : null,
    region ? null : t("common.climbCount", { count: climbs.length }),
  ].filter((part): part is string => part !== null);

  return (
    <div className="area-page">
      <Breadcrumb ancestors={ancestors} />

      <div className="area-head">
        <div className="area-head-text">
          <div className="area-head-title">
            <h1 className="area-title">{area.name}</h1>
            {isPending(area) && <PendingBadge />}
          </div>
          <span className="area-meta">{meta.join(" · ")}</span>
        </div>
        <AreaMenu
          items={[
            {
              label: t("areas.suggestEdits"),
              onSelect: () => setDialog("suggest"),
              disabled: region || area.status !== "active",
            },
            { label: t("areas.addSubArea"), onSelect: () => setDialog("subArea") },
            { label: t("areas.addClimb"), onSelect: () => setDialog("climb"), disabled: region },
            { label: t("areas.reportIssue"), onSelect: () => setDialog("report") },
          ]}
        />
      </div>

      {area.description !== null && <p className="area-description">{area.description}</p>}
      {notice !== null && <Notice>{notice}</Notice>}

      {(children.length > 0 || region) && (
        <>
          <div className="projects-section">
            <h2 className="projects-section-title">{t("areas.areas")}</h2>
            <span className="projects-section-meta">{formatNumber(children.length)}</span>
          </div>
          <div className="area-list">
            {children.map((child) => (
              <Link
                key={child.id}
                to={`/app/areas/${child.slug}`}
                className="area-row area-row--child"
              >
                <span className="project-name">{child.name}</span>
                <span>{isPending(child) && <PendingBadge />}</span>
                <span className="project-chevron">›</span>
              </Link>
            ))}
            {children.length === 0 && (
              <div className="area-empty">
                <p style={{ margin: "0 0 12px" }}>{t("areas.noAreasYet")}</p>
                <Button variant="ghostOnLight" size="sm" onClick={() => setDialog("subArea")}>
                  {t("areas.addSubArea")}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {!region && (
        <>
          <div className="projects-section">
            <h2 className="projects-section-title">{t("common.climbs")}</h2>
            <span className="projects-section-meta">{formatNumber(climbs.length)}</span>
          </div>
          <div className="area-list">
            {climbs.map((climb) => (
              <Link key={climb.id} to={`/app/climbs/${climb.slug}`} className="area-row">
                <span
                  className={
                    climb.grade_value === null
                      ? "project-grade project-grade--none"
                      : "project-grade"
                  }
                >
                  {areaClimbGradeLabel(climb)}
                </span>
                <span className="project-main">
                  <span className="project-name">{climb.name}</span>
                  <span className="project-meta">{climbTypeLabel(climb.type)}</span>
                </span>
                <span>{isPending(climb) && <PendingBadge />}</span>
                <span className="project-chevron">›</span>
              </Link>
            ))}
            {climbs.length === 0 && (
              <div className="area-empty">
                <p style={{ margin: "0 0 12px" }}>{t("areas.noClimbsYet")}</p>
                <Button variant="ghostOnLight" size="sm" onClick={() => setDialog("climb")}>
                  {t("areas.addClimb")}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {dialog === "suggest" && (
        <AreaFormDialog
          mode="suggest"
          api={api}
          area={area}
          onClose={close}
          onSuggested={done(t("areas.suggestionSent"))}
        />
      )}
      {dialog === "subArea" && (
        <AreaFormDialog mode="create" api={api} parent={area} onClose={close} onSuggested={close} />
      )}
      {dialog === "climb" && (
        <ClimbFormDialog mode="create" api={api} area={area} onClose={close} onSuggested={close} />
      )}
      {dialog === "report" && (
        <ReportIssueDialog
          api={api}
          entityType="area"
          entityId={area.id}
          name={area.name}
          onClose={close}
          onReported={done(t("areas.reportSent"))}
        />
      )}
    </div>
  );
}

import React from "react";
import { Link } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import {
  areaClimbGradeLabel,
  climbFacts,
  climbSessionVMs,
  isPending,
  type AreaClimbPage,
} from "@sendtally/features/areas";
import { formatNumber, t } from "@sendtally/features/i18n";
import { AreaMenu } from "./AreaMenu";
import { Breadcrumb } from "./Breadcrumb";
import { ClimbFormDialog } from "./ClimbFormDialog";
import { Notice } from "./Notice";
import { PendingBadge } from "./PendingBadge";
import { ReportDuplicateDialog } from "./ReportDuplicateDialog";
import { ReportIssueDialog } from "./ReportIssueDialog";

type Dialog = "suggest" | "duplicate" | "report" | null;

export function ClimbPageView({
  api,
  page,
}: {
  api: SendtallyApi;
  page: AreaClimbPage;
}): React.ReactElement {
  const { climb, ancestors } = page;
  const sessions = climbSessionVMs(page.sessions);
  const [dialog, setDialog] = React.useState<Dialog>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const close = React.useCallback(() => setDialog(null), []);
  const done = (message: string) => (): void => {
    setDialog(null);
    setNotice(message);
  };

  return (
    <div>
      <Breadcrumb ancestors={ancestors} />

      <div className="area-head">
        <div className="area-head-text">
          <div className="area-head-title">
            <span className="project-detail-grade">{areaClimbGradeLabel(climb)}</span>
            <h1 className="area-title">{climb.name}</h1>
            {isPending(climb) && <PendingBadge />}
          </div>
        </div>
        <AreaMenu
          items={[
            {
              label: t("areas.suggestEdits"),
              onSelect: () => setDialog("suggest"),
              disabled: climb.status !== "active",
            },
            { label: t("areas.reportDuplicate"), onSelect: () => setDialog("duplicate") },
            { label: t("areas.reportIssue"), onSelect: () => setDialog("report") },
          ]}
        />
      </div>

      <div className="area-facts">
        {climbFacts(climb).map((fact) => (
          <div key={fact.label} className="area-fact">
            <span className="area-fact-label">{fact.label}</span>
            <span className="area-fact-value">{fact.value}</span>
          </div>
        ))}
      </div>

      {climb.description !== null && <p className="area-description">{climb.description}</p>}
      {notice !== null && <Notice>{notice}</Notice>}

      <div className="projects-section">
        <h2 className="projects-section-title">{t("areas.yourSessions")}</h2>
        <span className="projects-section-meta">{formatNumber(sessions.length)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {sessions.map((session) => (
          <Link
            key={session.fingerprint}
            to={`/app/sessions/${session.fingerprint}`}
            className="area-session-row"
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{session.title}</span>
              <span className="project-meta">{session.dateLabel}</span>
            </span>
            <span
              className={session.sent ? "project-status project-status--sent" : "project-status"}
            >
              {t(session.sent ? "common.sent" : "areas.tried")}
            </span>
            <span className="project-chevron">›</span>
          </Link>
        ))}
        {sessions.length === 0 && <span className="area-empty">{t("areas.notLoggedYet")}</span>}
      </div>

      {dialog === "suggest" && (
        <ClimbFormDialog
          mode="suggest"
          api={api}
          climb={climb}
          onClose={close}
          onSuggested={done(t("areas.suggestionSent"))}
        />
      )}
      {dialog === "duplicate" && (
        <ReportDuplicateDialog
          api={api}
          climb={climb}
          onClose={close}
          onReported={done(t("areas.duplicateSent"))}
        />
      )}
      {dialog === "report" && (
        <ReportIssueDialog
          api={api}
          entityType="climb"
          entityId={climb.id}
          name={climb.name}
          onClose={close}
          onReported={done(t("areas.reportSent"))}
        />
      )}
    </div>
  );
}

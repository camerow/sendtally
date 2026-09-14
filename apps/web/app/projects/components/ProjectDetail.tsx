import React from "react";
import { Link, useNavigate } from "react-router";
import { useProject } from "@sendtally/features/climbs";
import { Button } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { useClientApi } from "../../lib/useClientApi";
import { BetaCard } from "./BetaCard";
import { ProjectChart } from "./ProjectChart";
import { UnmarkProjectDialog } from "./UnmarkProjectDialog";
import { BackLink } from "../../components/BackLink";

export type ProjectDetailProps = {
  apiUrl: string;
  slug: string;
};

const monoMuted: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "rgba(64,63,76,0.55)",
};

const cardLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "var(--text-label-accent)",
};

export function ProjectDetail({ apiUrl, slug }: ProjectDetailProps): React.ReactElement {
  const api = useClientApi(apiUrl);
  const navigate = useNavigate();
  const project = useProject(api, slug);
  const [unmarking, setUnmarking] = React.useState(false);
  const { state } = project;

  if (state.status === "loading") {
    return <span style={{ ...monoMuted, display: "block" }}>{t("common.loading")}</span>;
  }
  if (state.status === "error") {
    return (
      <span style={{ ...monoMuted, textTransform: "none", display: "block" }}>
        {t("projects.loadOneFailed")} <Link to="/app/projects">{t("projects.backToProjects")}</Link>
      </span>
    );
  }

  const vm = state.data;
  const sent = vm.status === "sent";

  return (
    <div>
      <BackLink to="/app/projects">{t("common.projects")}</BackLink>

      <div className="project-detail-head">
        <span className="project-detail-grade">
          {vm.gradeLabel ?? (
            <span style={{ textTransform: "uppercase" }}>{vm.disciplineLabel}</span>
          )}
        </span>
        <h1 className="project-detail-title">{vm.name}</h1>
        <span className={sent ? "project-status project-status--sent" : "project-status"}>
          {t(sent ? "common.sent" : "projects.statusOpen")}
        </span>
        <div style={{ flex: 1 }} />
        <Button variant="ghostOnLight" size="sm" onClick={() => setUnmarking(true)}>
          {t("projects.unmarkProject")}
        </Button>
      </div>

      {sent && vm.storyLabel !== null && (
        <div className="project-send-banner">
          <span className="project-send-banner-label">
            {t("projects.sentBanner", { value: vm.stats[3]?.value ?? "" })}
          </span>
          <span className="project-send-banner-value">{vm.storyLabel}</span>
          <span className="project-send-banner-label">
            {t("projects.firstTried", {
              date: vm.bars[0]?.axisLabel ?? "-",
              value: vm.stats[2]?.value ?? "",
            })}
          </span>
        </div>
      )}

      <div
        className="ds-statstrip"
        style={{ "--statstrip-cols": 4, marginTop: 24 } as React.CSSProperties}
      >
        {vm.stats.map((stat) => (
          <div key={stat.label} className="ds-statstrip-cell">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-on-white-secondary)",
              }}
            >
              {stat.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                fontSize: 17,
                textTransform: "uppercase",
              }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="project-detail-panels">
        <div className="project-card">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={cardLabel}>{t("projects.attemptsPerSession")}</span>
            <div style={{ flex: 1 }} />
            <span style={{ ...monoMuted, fontSize: 10, letterSpacing: "0.08em" }}>
              {vm.rangeLabel}
            </span>
          </div>
          {vm.bars.length === 0 ? (
            <span
              style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-on-white-secondary)" }}
            >
              {t("projects.chartEmpty")}
            </span>
          ) : (
            <ProjectChart bars={vm.bars} />
          )}
        </div>

        <BetaCard
          beta={vm.beta}
          updatedLabel={vm.betaUpdatedLabel}
          onSave={(beta) => project.saveBeta(beta)}
        />
      </div>

      <div className="projects-section">
        <h2 className="projects-section-title">{t("projects.sessionsInvested")}</h2>
        <span className="projects-section-meta">{vm.sessionsMetaLabel}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {vm.sessions.map((session) => (
          <Link
            key={session.fingerprint}
            to={`/app/sessions/${session.fingerprint}`}
            className="project-session-row"
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ ...monoMuted, fontSize: 10, letterSpacing: "0.08em" }}>
                {session.weekday}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  fontSize: 16,
                  textTransform: "uppercase",
                }}
              >
                {session.dateLabel}
              </span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{session.title}</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-on-white-secondary)",
                }}
              >
                {session.metaLabel}
                {session.sent && (
                  <span style={{ textTransform: "uppercase" }}>{t("projects.sessionSent")}</span>
                )}
              </span>
            </span>
            <span className="project-session-note">{session.notes ?? ""}</span>
            <span
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15 }}>
                {session.attempts}
              </span>
              <span style={{ ...monoMuted, fontSize: 9 }}>
                {t("projects.attemptsUnit", { count: session.attempts })}
              </span>
            </span>
            <span className="project-chevron">›</span>
          </Link>
        ))}
        {vm.sessions.length === 0 && (
          <span style={{ ...monoMuted, padding: "18px 4px" }}>{t("projects.notTriedYet")}</span>
        )}
      </div>

      {unmarking && (
        <UnmarkProjectDialog
          project={vm}
          onClose={() => setUnmarking(false)}
          onConfirm={async () => {
            await project.unmark();
            void navigate("/app/projects");
          }}
        />
      )}
    </div>
  );
}

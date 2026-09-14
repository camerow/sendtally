import React from "react";
import { Link } from "react-router";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  useClimbVocabulary,
  useProjects,
  type ProjectListItem,
  type ProjectsOverviewVM,
} from "@sendtally/features/climbs";
import { Button, Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { useClientApi } from "../../lib/useClientApi";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { AddProjectDialog } from "./AddProjectDialog";
import { ProjectRow } from "./ProjectRow";

export type ProjectsListProps = {
  apiUrl: string;
};

const monoMuted: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "rgba(64,63,76,0.55)",
};

const muted: React.CSSProperties = {
  padding: 36,
  textAlign: "center",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  lineHeight: 1.6,
  color: "rgba(64,63,76,0.55)",
};

type Tile = { label: string; value: string; caption: string; to?: string };

// A tile with nothing to say is noise, so the strip grows as the history does.
function tiles(overview: ProjectsOverviewVM): Tile[] {
  const { longestRunning, mostSessions } = overview;
  const all: Array<Tile | null> = [
    {
      label: t("projects.tileOpen"),
      value: String(overview.open),
      caption: t("projects.tileOpenCaption", { n: overview.attemptsInvested }),
    },
    overview.avgAttemptsToSend === null
      ? null
      : {
          label: t("projects.attemptsToSend"),
          value: String(overview.avgAttemptsToSend),
          caption: t("projects.tileAttemptsToSendCaption", { n: overview.sent }),
        },
    longestRunning === null
      ? null
      : {
          label: t("projects.longestRunning"),
          value: longestRunning.value,
          caption: longestRunning.name,
          to: `/app/projects/${longestRunning.slug}`,
        },
    mostSessions === null
      ? null
      : {
          label: t("projects.tileMostSessions"),
          value: mostSessions.value,
          caption: mostSessions.name,
          to: `/app/projects/${mostSessions.slug}`,
        },
  ];
  return all.filter((t): t is Tile => t !== null);
}

function Section({
  title,
  meta,
  items,
}: {
  title: string;
  meta: string;
  items: ProjectListItem[];
}): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <>
      <div className="projects-section">
        <h2 className="projects-section-title">{title}</h2>
        <span className="projects-section-meta">{meta}</span>
      </div>
      <div className="projects-list">
        {items.map((item) => (
          <ProjectRow key={item.climb.slug} item={item} />
        ))}
      </div>
    </>
  );
}

export function ProjectsList({ apiUrl }: ProjectsListProps): React.ReactElement {
  const api = useClientApi(apiUrl);
  const projects = useProjects(api);
  const vocabulary = useClimbVocabulary(api);
  const { scales } = useGradeScalePrefs(api);
  const [adding, setAdding] = React.useState(false);
  const { state } = projects;

  const climbs: ClimbSummary[] = vocabulary.climbs;
  const ready = state.status === "ready" ? state.data : null;

  return (
    <div>
      <div className="sessions-head">
        <span className="sessions-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="sessions-title">{t("common.projects")}</h1>
        {ready !== null && (
          <span style={monoMuted}>
            {t("projects.openSentCount", {
              open: ready.overview.open,
              sent: ready.overview.sent,
            })}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <Button variant="azure" size="sm" onClick={() => setAdding(true)}>
          {t("projects.newProject")}
        </Button>
      </div>

      {state.status === "loading" && (
        <span style={{ ...monoMuted, display: "block", marginTop: 22 }}>{t("common.loading")}</span>
      )}
      {state.status === "error" && (
        <span style={{ ...monoMuted, textTransform: "none", display: "block", marginTop: 22 }}>
          {t("projects.loadFailed")}
        </span>
      )}

      {ready !== null && (
        <>
          {(ready.open.length > 0 || ready.sent.length > 0) && (
            <div className="projects-stats">
              {tiles(ready.overview).map((tile) =>
                tile.to === undefined ? (
                  <div key={tile.label} className="projects-stat">
                    <span className="projects-stat-label">{tile.label}</span>
                    <span className="projects-stat-value">{tile.value}</span>
                    <span className="projects-stat-caption">{tile.caption}</span>
                  </div>
                ) : (
                  <Link key={tile.label} to={tile.to} className="projects-stat">
                    <span className="projects-stat-label">{tile.label}</span>
                    <span className="projects-stat-value">{tile.value}</span>
                    <span className="projects-stat-caption">{tile.caption}</span>
                  </Link>
                )
              )}
            </div>
          )}

          <Section
            title={t("common.open")}
            meta={t("projects.sectionOpenMeta", {
              count: ready.open.length,
              attempts: ready.overview.attemptsInvested,
            })}
            items={ready.open}
          />
          <Section
            title={t("common.sentStatus")}
            meta={
              ready.overview.hardestSentLabel === null
                ? t("projects.sectionSentMeta", { count: ready.sent.length })
                : t("projects.sectionSentMetaHardest", {
                    count: ready.sent.length,
                    hardest: ready.overview.hardestSentLabel,
                  })
            }
            items={ready.sent}
          />

          {ready.open.length === 0 && ready.sent.length === 0 && (
            <div style={muted}>
              {t("projects.emptyBefore")}{" "}
              <Link to="/app/sessions/new" style={{ color: "var(--bs-azure-ink)" }}>
                {t("projects.emptyLink")}
              </Link>{" "}
              {t("projects.emptyAfter")}
            </div>
          )}
        </>
      )}

      {adding && (
        <AddProjectDialog
          climbs={climbs}
          scales={scales}
          onClose={() => setAdding(false)}
          onSave={async (input) => {
            await projects.save(input);
            await vocabulary.reload();
          }}
        />
      )}
    </div>
  );
}

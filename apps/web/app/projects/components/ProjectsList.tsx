import React from "react";
import { Link } from "react-router";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  climbGradeLabel,
  projectMetaLabel,
  projectStatus,
  projectsOf,
  useClimbVocabulary,
} from "@sendtally/features/climbs";
import { Logo } from "@sendtally/design";
import { useClientApi } from "../../lib/useClientApi";

export type ProjectsListProps = {
  apiUrl: string;
};

const monoMuted: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
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

function lastTriedLabel(climb: ClimbSummary): string {
  if (climb.sessions === 0) return "NOT TRIED YET";
  const d = new Date(climb.last_at);
  return `LAST ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).toUpperCase()}`;
}

function ProjectRow({
  climb,
  onUnmark,
}: {
  climb: ClimbSummary;
  onUnmark: () => void;
}): React.ReactElement {
  const sent = projectStatus(climb) === "sent";
  return (
    <div className="project-row">
      <span className="project-grade">{climbGradeLabel(climb)}</span>
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="project-name">{climb.name}</span>
        <span style={monoMuted}>
          {projectMetaLabel(climb)} · {lastTriedLabel(climb)}
        </span>
      </div>
      <span
        className="project-status"
        style={{
          ...monoMuted,
          fontSize: 10,
          padding: "5px 9px",
          borderRadius: "var(--radius-pill)",
          background: sent ? "var(--bs-gold)" : "rgba(64,63,76,0.06)",
          color: "var(--bs-gunmetal)",
        }}
      >
        {sent ? "SENT" : "OPEN"}
      </span>
      <button
        type="button"
        onClick={onUnmark}
        className="project-unmark"
        style={{
          ...monoMuted,
          fontSize: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        REMOVE
      </button>
    </div>
  );
}

export function ProjectsList({ apiUrl }: ProjectsListProps): React.ReactElement {
  const api = useClientApi(apiUrl);
  const vocabulary = useClimbVocabulary(api);
  const [error, setError] = React.useState<string | null>(null);
  const projects = projectsOf(vocabulary.climbs);
  const open = projects.filter((p) => projectStatus(p) === "open").length;

  async function unmark(climb: ClimbSummary): Promise<void> {
    setError(null);
    try {
      await vocabulary.setProject(climb.name, climb.grade, false);
    } catch {
      setError("Could not remove the project. Try again.");
    }
  }

  return (
    <div>
      <div className="sessions-head">
        <span className="sessions-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="sessions-title">Projects</h1>
        {vocabulary.loaded && (
          <span style={monoMuted}>
            {open} OPEN · {projects.length - open} SENT
          </span>
        )}
      </div>
      {error !== null && (
        <span
          style={{
            ...monoMuted,
            display: "block",
            marginTop: 22,
            color: "var(--text-label-accent)",
          }}
        >
          {error}
        </span>
      )}
      {!vocabulary.loaded && (
        <span style={{ ...monoMuted, display: "block", marginTop: 22 }}>LOADING…</span>
      )}
      {vocabulary.loaded && projects.length === 0 && (
        <div style={muted}>
          No projects yet. Flag a climb while{" "}
          <Link to="/app/sessions/new" style={{ color: "var(--bs-azure-ink)" }}>
            logging a session
          </Link>{" "}
          and every attempt and session you put into it adds up here.
        </div>
      )}
      {projects.length > 0 && (
        <div className="projects-list">
          {projects.map((climb) => (
            <ProjectRow key={climb.slug} climb={climb} onUnmark={() => void unmark(climb)} />
          ))}
        </div>
      )}
    </div>
  );
}

import React from "react";
import type { ClimbSummary, GradeScales, ProjectInput } from "@sendtally/api-client";
import {
  climbGradeLabel,
  matchClimbs,
  projectMetaLabel,
  typicalGradeIndex,
} from "@sendtally/features/climbs";
import {
  disciplineOf,
  draftGrade,
  gradeOptions,
  type Discipline,
} from "@sendtally/features/log-session";
import { Button } from "@sendtally/design";

export type AddProjectDialogProps = {
  climbs: ClimbSummary[];
  scales: GradeScales;
  onClose: () => void;
  onSave: (input: ProjectInput) => Promise<void>;
};

const DISCIPLINES: Array<{ value: Discipline; label: string }> = [
  { value: "boulder", label: "BOULDER" },
  { value: "route", label: "SPORT" },
];

const chip = (active: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  padding: "0 16px",
  minHeight: 40,
  flexShrink: 0,
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  background: active ? "var(--bs-gold)" : "transparent",
  color: active ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
  border: active ? "1px solid var(--bs-gold)" : "1px solid rgba(64,63,76,0.18)",
});

const input: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-white)",
  border: "1px solid rgba(64,63,76,0.15)",
  borderRadius: "var(--radius-control)",
  padding: "14px 16px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function suggestionMeta(climb: ClimbSummary): string {
  if (climb.project) return "ALREADY A PROJECT";
  if (climb.sessions === 0) return "NOTHING LOGGED YET";
  return projectMetaLabel(climb);
}

export function AddProjectDialog({
  climbs,
  scales,
  onClose,
  onSave,
}: AddProjectDialogProps): React.ReactElement {
  const [name, setName] = React.useState("");
  const [picked, setPicked] = React.useState<ClimbSummary | null>(null);
  const [tracking, setTracking] = React.useState(false);
  const [discipline, setDiscipline] = React.useState<Discipline>("boulder");
  const [grade, setGrade] = React.useState("");
  const [beta, setBeta] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const rail = React.useRef<HTMLDivElement>(null);

  const trimmed = name.trim();
  const matches = trimmed === "" ? [] : matchClimbs(climbs, name);
  const exact = climbs.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  const identified = picked !== null || tracking;
  const searching = !identified;
  const showSuggestions =
    searching && trimmed !== "" && (matches.length > 0 || exact === undefined);

  const scale = picked?.grade?.scale ?? (discipline === "boulder" ? scales.boulder : scales.route);
  const ladder = gradeOptions(scale);
  const needsGrade = identified && (picked === null || picked.grade === null);
  const identityName = picked?.name ?? trimmed;
  const identityGrade = needsGrade
    ? grade === "" || grade === undefined
      ? "-"
      : grade
    : picked === null
      ? "-"
      : climbGradeLabel(picked);

  // Opening the rail at the bottom of the ladder hides every grade the user
  // would pick, so it starts where they climb.
  React.useEffect(() => {
    if (!needsGrade) return;
    const index = grade === "" ? typicalGradeIndex(climbs, scale) : ladder.indexOf(grade);
    const chipEl = rail.current?.children[Math.max(0, index)];
    chipEl?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [needsGrade, grade, scale, ladder, climbs]);

  function type(value: string): void {
    setName(value);
    setPicked(null);
    setTracking(false);
  }

  function pick(climb: ClimbSummary): void {
    setName(climb.name);
    setPicked(climb);
    setTracking(false);
    setDiscipline(climb.discipline);
    setGrade("");
  }

  function change(): void {
    setPicked(null);
    setTracking(false);
    setGrade("");
    setName("");
  }

  async function save(): Promise<void> {
    if (trimmed === "" || !identified) return;
    const chosen = needsGrade ? draftGrade(grade, scale) : undefined;
    if (needsGrade && chosen === undefined) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({
        name: picked?.name ?? trimmed,
        ...(chosen === undefined ? {} : { grade: chosen, discipline: disciplineOf(chosen.scale) }),
        ...(beta.trim() === "" ? {} : { beta: beta.trim() }),
      });
      onClose();
    } catch {
      setBusy(false);
      setError("Could not add the project. Try again.");
    }
  }

  return (
    <div
      className="project-dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="project-dialog" role="dialog" aria-modal="true" aria-label="New project">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--text-label-accent)",
            }}
          >
            NEW PROJECT
          </span>
        </div>

        {searching && (
          <div className="project-dialog-field">
            <label className="project-dialog-label" htmlFor="project-name">
              WHICH CLIMB
            </label>
            <input
              id="project-name"
              value={name}
              autoFocus
              autoComplete="off"
              placeholder="Name of the climb"
              onChange={(e) => type(e.target.value)}
              style={input}
            />
            {showSuggestions && (
              <div className="project-dialog-suggestions">
                {matches.map((climb) => (
                  <button
                    key={climb.slug}
                    type="button"
                    className="project-dialog-suggestion"
                    disabled={climb.project}
                    onClick={() => pick(climb)}
                    style={climb.project ? { opacity: 0.45, cursor: "default" } : undefined}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        fontSize: 13,
                        minWidth: 42,
                      }}
                    >
                      {climbGradeLabel(climb)}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{climb.name}</span>
                    <span style={{ flex: 1 }} />
                    <span className="project-dialog-hint">{suggestionMeta(climb)}</span>
                  </button>
                ))}
                {exact === undefined && (
                  <button
                    type="button"
                    className="project-dialog-suggestion"
                    onClick={() => setTracking(true)}
                  >
                    <span style={{ display: "flex", minWidth: 42 }}>
                      <svg
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="var(--bs-azure-ink)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--bs-azure-ink)" }}>
                      Track “{trimmed}” as a new climb
                    </span>
                  </button>
                )}
              </div>
            )}
            <span className="project-dialog-hint">
              START TYPING - PICK ONE YOU HAVE LOGGED AND IT KEEPS ITS HISTORY
            </span>
          </div>
        )}

        {identified && (
          <div className="project-dialog-field">
            <span className="project-dialog-label">
              {picked === null ? "NEW CLIMB" : "FROM YOUR LOGBOOK"}
            </span>
            <div className="project-dialog-identity">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  fontSize: 15,
                  minWidth: 48,
                  color: identityGrade === "-" ? "rgba(64,63,76,0.38)" : "var(--bs-gunmetal)",
                }}
              >
                {identityGrade}
              </span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{identityName}</span>
              <span style={{ flex: 1 }} />
              <button type="button" onClick={change} className="project-dialog-change">
                CHANGE
              </button>
            </div>
          </div>
        )}

        {needsGrade && (
          <>
            <div className="project-dialog-field">
              <span className="project-dialog-label">DISCIPLINE</span>
              <div style={{ display: "flex", gap: 8 }}>
                {DISCIPLINES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={discipline === d.value}
                    disabled={picked !== null}
                    onClick={() => {
                      setDiscipline(d.value);
                      setGrade("");
                    }}
                    style={chip(discipline === d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="project-dialog-field">
              <span className="project-dialog-label">GRADE</span>
              <div ref={rail} className="project-dialog-rail">
                {ladder.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={g === grade}
                    onClick={() => setGrade(g)}
                    style={chip(g === grade)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="project-dialog-field">
          <label className="project-dialog-label" htmlFor="project-beta">
            BETA <span style={{ color: "rgba(64,63,76,0.45)" }}>· OPTIONAL</span>
          </label>
          <textarea
            id="project-beta"
            value={beta}
            rows={2}
            placeholder="What you know about it so far"
            onChange={(e) => setBeta(e.target.value)}
            style={{ ...input, resize: "vertical", fontFamily: "var(--font-sans)" }}
          />
        </div>

        {error !== null && (
          <span className="project-dialog-hint" style={{ color: "var(--text-label-accent)" }}>
            {error}
          </span>
        )}

        <div className="project-dialog-actions">
          <Button variant="ghostOnLight" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="azure"
            disabled={!identified || (needsGrade && grade === "") || busy}
            onClick={() => void save()}
          >
            {busy ? "Adding…" : "Add project"}
          </Button>
        </div>
      </div>
    </div>
  );
}

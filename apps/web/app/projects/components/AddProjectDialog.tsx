import React from "react";
import type { ClimbSummary, Discipline, ProjectInput } from "@sendtally/api-client";
import { climbGradeLabel, matchClimbs, projectMetaLabel } from "@sendtally/features/climbs";
import { Button } from "@sendtally/design";

export type AddProjectDialogProps = {
  climbs: ClimbSummary[];
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
  padding: "10px 16px",
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
  onClose,
  onSave,
}: AddProjectDialogProps): React.ReactElement {
  const [name, setName] = React.useState("");
  const [discipline, setDiscipline] = React.useState<Discipline>("boulder");
  const [beta, setBeta] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const trimmed = name.trim();
  const matches = trimmed === "" ? [] : matchClimbs(climbs, name);
  const exact = climbs.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());

  function pick(climb: ClimbSummary): void {
    setName(climb.name);
    setDiscipline(climb.discipline);
  }

  async function save(): Promise<void> {
    if (trimmed === "") return;
    setBusy(true);
    setError(null);
    try {
      await onSave({
        name: trimmed,
        discipline,
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

        <div className="project-dialog-field">
          <label className="project-dialog-label" htmlFor="project-name">
            NAME
          </label>
          <input
            id="project-name"
            value={name}
            autoFocus
            autoComplete="off"
            placeholder="Name of the climb"
            onChange={(e) => setName(e.target.value)}
            style={input}
          />
          {trimmed !== "" && (
            <div className="project-dialog-suggestions">
              {matches.map((climb) => (
                <button
                  key={climb.slug}
                  type="button"
                  className="project-dialog-suggestion"
                  onClick={() => pick(climb)}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontSize: 13,
                      width: 34,
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
                <span className="project-dialog-suggestion">
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="var(--bs-azure-ink)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ flex: "none" }}
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--bs-azure-ink)" }}>
                    Track “{trimmed}” as a new climb
                  </span>
                </span>
              )}
            </div>
          )}
          <span className="project-dialog-hint">
            PICK A CLIMB YOU HAVE LOGGED TO KEEP ITS HISTORY, OR TRACK A NEW ONE
          </span>
        </div>

        <div className="project-dialog-field">
          <span className="project-dialog-label">DISCIPLINE</span>
          <div style={{ display: "flex", gap: 8 }}>
            {DISCIPLINES.map((d) => (
              <button
                key={d.value}
                type="button"
                aria-pressed={discipline === d.value}
                onClick={() => setDiscipline(d.value)}
                style={chip(discipline === d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <span className="project-dialog-hint">
            THE GRADE COMES FROM THE FIRST SESSION YOU LOG IT IN
          </span>
        </div>

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
          <Button variant="azure" disabled={trimmed === "" || busy} onClick={() => void save()}>
            {busy ? "Adding…" : "Add project"}
          </Button>
        </div>
      </div>
    </div>
  );
}

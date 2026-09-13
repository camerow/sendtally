import React from "react";
import { Button } from "@sendtally/design";
import type { ProjectDetailVM } from "@sendtally/features/climbs";

export type UnmarkProjectDialogProps = {
  project: ProjectDetailVM;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

function keepsLabel(project: ProjectDetailVM): string {
  if (project.sessions.length === 0) return "Nothing is logged against it yet.";
  const attempts = project.stats[0]?.value ?? "0";
  const sessions = project.stats[1]?.value ?? "0";
  return `The ${attempts} attempts over ${sessions} sessions stay in your log and the beta stays on the climb, so you can flag it again any time.`;
}

export function UnmarkProjectDialog({
  project,
  onClose,
  onConfirm,
}: UnmarkProjectDialogProps): React.ReactElement {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function confirm(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setBusy(false);
      setError("Could not unmark the project. Try again.");
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
      <div
        className="project-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Unmark project"
        style={{ gap: 14 }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "var(--text-label-accent)",
          }}
        >
          UNMARK PROJECT
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
          }}
        >
          Stop tracking {project.name}?
        </span>
        <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-on-white-secondary)" }}>
          It leaves your projects list. {keepsLabel(project)}
        </span>
        {error !== null && (
          <span className="project-dialog-hint" style={{ color: "var(--text-label-accent)" }}>
            {error}
          </span>
        )}
        <div className="project-dialog-actions" style={{ marginTop: 6 }}>
          <Button variant="ghostOnLight" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => void confirm()}>
            {busy ? "Unmarking…" : "Unmark project"}
          </Button>
        </div>
      </div>
    </div>
  );
}

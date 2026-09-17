import React from "react";
import { t } from "@sendtally/features/i18n";
import { Glyph } from "./Glyph";
import { FLAG } from "./styles";

export type ProjectToggleProps = {
  project: boolean;
  named: boolean;
  /** A circuit of laps is never a project, so the control is dead rather than waiting on a name. */
  onToggle: () => void;
};

export function ProjectToggle({
  project,
  named,
  onToggle,
}: ProjectToggleProps): React.ReactElement {
  const on = named;
  return (
    <button
      type="button"
      aria-pressed={project}
      disabled={!on}
      title={named ? undefined : t("logSession.projectHint")}
      onClick={onToggle}
      className="climb-project"
      style={{
        background: project ? "var(--bs-gold)" : "transparent",
        border: project ? "1px solid var(--bs-gold)" : "1px solid rgba(64,63,76,0.18)",
        color: project ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
        opacity: on ? 1 : 0.4,
        cursor: on ? "pointer" : "default",
      }}
    >
      <Glyph d={FLAG} size={13} width={1.7} filled={project} />
      {t("common.project")}
    </button>
  );
}

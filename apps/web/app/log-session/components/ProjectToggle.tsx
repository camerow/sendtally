import React from "react";
import { t, upper } from "@sendtally/features/i18n";
import { Glyph } from "./Glyph";
import { FLAG } from "./styles";

export type ProjectToggleProps = {
  project: boolean;
  named: boolean;
  onToggle: () => void;
};

export function ProjectToggle({
  project,
  named,
  onToggle,
}: ProjectToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      aria-pressed={project}
      disabled={!named}
      title={named ? undefined : t("web.logSession.projectHint")}
      onClick={onToggle}
      className="climb-project"
      style={{
        background: project ? "var(--bs-gold)" : "transparent",
        border: project ? "1px solid var(--bs-gold)" : "1px solid rgba(64,63,76,0.18)",
        color: project ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
        opacity: named ? 1 : 0.4,
        cursor: named ? "pointer" : "default",
      }}
    >
      <Glyph d={FLAG} size={13} width={1.7} filled={project} />
      {upper(t("web.logSession.project"))}
    </button>
  );
}

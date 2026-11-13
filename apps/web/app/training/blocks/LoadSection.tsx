import React from "react";
import { Icon } from "../../components/Icon";

export type LoadSectionProps = {
  name: string;
  /** Its dose, and which weeks change it. */
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

/** One exercise of a workout in its block: its weekly load when open, what changes when closed. */
export function LoadSection({
  name,
  summary,
  open,
  onToggle,
  children,
}: LoadSectionProps): React.ReactElement {
  return (
    <section className={open ? "load-section load-section--open" : "load-section"}>
      <button type="button" className="load-section-head" aria-expanded={open} onClick={onToggle}>
        <span className="load-section-text">
          <span className="load-section-name">{name}</span>
          <span className="load-section-summary">{summary}</span>
        </span>
        <span className={open ? "load-section-chevron is-open" : "load-section-chevron"}>
          <Icon name="chevron" size={14} strokeWidth={2.2} />
        </span>
      </button>
      {open && children}
    </section>
  );
}

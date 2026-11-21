import React from "react";

export type DarkCardProps = {
  label: string;
  /** Right of the label: what the card counts so far. */
  meta?: string;
  /** Under a rule at the foot: what the next action adds. */
  note?: React.ReactNode;
  /** Lifted off the form it sits beside or above. */
  raised?: boolean;
  children?: React.ReactNode;
};

/** The wizard's payoff card: on the app's dark ground, what the step has made so far. */
export function DarkCard({
  label,
  meta,
  note,
  raised = false,
  children,
}: DarkCardProps): React.ReactElement {
  return (
    <section className={raised ? "dark-card dark-card--raised" : "dark-card"}>
      <div className="dark-card-head">
        <span className="dark-label">{label}</span>
        {meta !== undefined && meta !== "" && <span className="dark-meta">{meta}</span>}
      </div>
      {children}
      {note !== undefined && <p className="dark-meta dark-card-note">{note}</p>}
    </section>
  );
}

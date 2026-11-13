import React from "react";
import { Link } from "react-router";
import type { WorkoutKind } from "@sendtally/core/hang";
import type { LoggedRowText } from "@sendtally/features/training";
import { EffortMark } from "../../components/detail/EffortMark";
import { KindCircle } from "./KindCircle";

/** A session or activity logged on the day, checked on its kind's mark, with its effort. */
export function LoggedRow({
  kind,
  text,
  to,
}: {
  kind: WorkoutKind;
  text: LoggedRowText;
  to: string;
}): React.ReactElement {
  return (
    <Link to={to} className="plan-row plan-row--link">
      <KindCircle kind={kind} badge="done" />
      <span className="plan-row-text">
        <span className="plan-row-name">{text.name}</span>
        <span className="plan-row-meta plan-label-small">{text.meta}</span>
      </span>
      <span className="plan-row-end">
        {text.right !== "" && <span className="plan-row-right">{text.right}</span>}
        {text.rpe !== null && <EffortMark rpe={text.rpe} />}
      </span>
    </Link>
  );
}

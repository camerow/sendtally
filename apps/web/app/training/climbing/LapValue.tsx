import React from "react";
import type { lapPlanOf } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { enduranceAmountLabel } from "@sendtally/features/log-session";
import { elapsedClock } from "@sendtally/features/sessions";
import { NumberField } from "../../components/NumberField";
import { Stepper } from "../components/Stepper";

export type LapPlan = ReturnType<typeof lapPlanOf>;

/** "28 moves", "4:30": what one lap was. */
const lapAmount = (plan: LapPlan, value: number): string =>
  enduranceAmountLabel({ ...plan, laps: [] }, value);

/** A lap's moves on − and +, out of the circuit's. */
function Moves({
  label,
  value,
  plan,
  onChange,
}: {
  label: string;
  value: number;
  plan: LapPlan;
  onChange: (moves: number) => void;
}): React.ReactElement {
  const field = `${label} · ${t("workouts.dose.moves")}`;
  const clamp = (n: number): number => Math.min(plan.target, Math.max(0, n));
  return (
    <span className="lap-moves">
      <Stepper
        compact
        onStep={(d) => onChange(clamp(value + d))}
        canDecrease={value > 0}
        canIncrease={value < plan.target}
        decreaseLabel={`${label} · ${t("tally.fewerMoves")}`}
        increaseLabel={`${label} · ${t("tally.moreMoves")}`}
      >
        <NumberField
          compact
          label={field}
          value={value}
          mode={{ kind: "number", min: 0, max: plan.target, step: 1 }}
          onChange={(n) => onChange(clamp(n))}
        />
      </Stepper>
      <span className="lap-of">
        {t("activities.holdOf", { time: lapAmount(plan, plan.target) })}
      </span>
    </span>
  );
}

/** A timed lap's time, out of the lap's. */
function LapTime({ seconds, plan }: { seconds: number; plan: LapPlan }): React.ReactElement {
  return (
    <span className="climb-line">
      {elapsedClock(seconds)}
      <span className="lap-of">{` ${t("activities.holdOf", { time: elapsedClock(plan.target) })}`}</span>
    </span>
  );
}

/**
 * One lap's value in its row, in the run and the review alike: a moves lap's moves on − and +,
 * a timed lap's time, which `onStart` starts with a press while its clock has not run.
 */
export function LapValue({
  label,
  value,
  plan,
  onChange,
  onStart,
}: {
  label: string;
  value: number;
  plan: LapPlan;
  onChange: (moves: number) => void;
  onStart?: () => void;
}): React.ReactElement {
  if (plan.unit !== "seconds")
    return <Moves label={label} value={value} plan={plan} onChange={onChange} />;
  return onStart === undefined ? (
    <LapTime seconds={value} plan={plan} />
  ) : (
    <button
      type="button"
      className="lap-clock"
      aria-label={`${label}, ${t("hang.start")}`}
      onClick={onStart}
    >
      <LapTime seconds={value} plan={plan} />
    </button>
  );
}

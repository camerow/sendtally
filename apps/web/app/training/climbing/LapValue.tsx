import React from "react";
import type { lapPlanOf } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { enduranceAmountLabel } from "@sendtally/features/log-session";
import { elapsedClock } from "@sendtally/features/sessions";
import { NumberField } from "../../components/NumberField";
import { Stepper } from "../components/Stepper";
import { ClockToggle } from "./ClockToggle";

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

/** A logged timed lap's time, typed to correct it, out of the lap's. */
function Time({
  label,
  value,
  plan,
  onChange,
}: {
  label: string;
  value: number;
  plan: LapPlan;
  onChange: (seconds: number) => void;
}): React.ReactElement {
  return (
    <span className="lap-moves lap-time">
      <NumberField
        compact
        label={`${label} · ${t("workouts.dose.time")}`}
        value={value}
        mode={{ kind: "time", min: 0, max: plan.target }}
        onChange={onChange}
      />
      <span className="lap-of">{t("activities.holdOf", { time: elapsedClock(plan.target) })}</span>
    </span>
  );
}

/**
 * One lap's value in its row, in the run and the review alike: a moves lap's moves on − and +,
 * a timed lap's time with its clock's start and pause in the run, or which a logged lap in Log
 * workout and Edit workout types to correct.
 */
export function LapValue({
  label,
  value,
  plan,
  onChange,
  clock,
  timeTyped = false,
}: {
  label: string;
  value: number;
  plan: LapPlan;
  /** Moves, or seconds for a timed lap. */
  onChange: (value: number) => void;
  /** A timed lap's clock in the run, started and paused from its row. */
  clock?: { running: boolean; onToggle: () => void } | undefined;
  timeTyped?: boolean;
}): React.ReactElement {
  if (plan.unit !== "seconds")
    return <Moves label={label} value={value} plan={plan} onChange={onChange} />;
  if (timeTyped) return <Time label={label} value={value} plan={plan} onChange={onChange} />;
  if (clock === undefined) return <LapTime seconds={value} plan={plan} />;
  return (
    <span className="lap-clock">
      <LapTime seconds={value} plan={plan} />
      <ClockToggle
        label={label}
        left={plan.target - value}
        running={clock.running}
        onToggle={clock.onToggle}
      />
    </span>
  );
}

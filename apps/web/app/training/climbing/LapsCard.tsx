import React from "react";
import type { SessionItem, SetDone, WeightUnit } from "@sendtally/core/hang";
import { lapPlanOf } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import {
  enduranceAmountLabel,
  useLapsTally,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { exerciseName, targetText, type RestClock } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import type { MoreMenuItem } from "../../components/MoreMenu";
import type { About } from "../components/AboutButton";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { SetRow, type SetRowProps } from "../components/SetRow";
import { Stepper } from "../components/Stepper";
import { useSessionTarget } from "../components/sessionTarget";
import { IdleRestRow } from "../players/IdleRestRow";
import { RestRow } from "../players/RestRow";

export type LapsCardProps = {
  item: number;
  at: SessionItem;
  /** The laps logged so far, for a card the tally is not on. */
  logged: readonly SetDone[];
  /** The laps it asks for now, after any + Add lap or −. */
  planned: number;
  /** The tally's draft while it is on this card. */
  draft: LogSessionDraft | null;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  unit: WeightUnit;
  about?: About | undefined;
  /** Where its history opens. */
  history?: string | undefined;
  onFold: () => void;
  menu: readonly MoreMenuItem[];
  /** A lap still to climb was taken out, for its Undo. */
  onLapRemoved: (lap: number) => void;
};

type LapPlan = ReturnType<typeof lapPlanOf>;
type Removable = Pick<SetRowProps, "selected" | "onSelect" | "onRemove">;

/** "28 moves", "4:30": what one lap was. */
const lapAmount = (plan: LapPlan, value: number): string =>
  enduranceAmountLabel({ ...plan, laps: [] }, value);

/** A lap climbed: what it was, in neutral ink whether or not it reached the target. */
function LapRow({ n, value }: { n: number; value: string }): React.ReactElement {
  return (
    <SetRow position={String(n)} label={`${t("tally.lapLabel", { lap: n })}, ${value}`} ticked>
      <span className="climb-line">{value}</span>
    </SetRow>
  );
}

/** A lap still to climb; selected, it can be taken out. */
function Waiting({ n, ...select }: { n: number } & Removable): React.ReactElement {
  return (
    <SetRow
      position={String(n)}
      label={t("tally.lapLabel", { lap: n })}
      removeLabel={t("tally.removeLapOf", { lap: n })}
      {...select}
    >
      {null}
    </SetRow>
  );
}

/** The lap on the wall: Attempt or Sent, and an Attempt asks in the row how far it got. */
function LiveLaps({
  draft,
  live,
  rest,
  now,
  plan,
  onLapRemoved,
}: {
  draft: LogSessionDraft;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  plan: LapPlan;
  onLapRemoved: (lap: number) => void;
}): React.ReactElement | null {
  const laps = useLapsTally(draft, live, rest, now);
  const [stepAt, setStepAt] = React.useState<{ lap: number; n: number } | null>(null);
  const [selected, setSelected] = React.useState<number | null>(null);
  if (laps === null) return null;
  const done = laps.rows.length;
  const step = stepAt?.lap === done ? stepAt.n : null;
  const setStep = (n: number | null): void => setStepAt(n === null ? null : { lap: done, n });
  const removeLap = laps.removeLap;
  const amounts = laps.circuit?.endurance?.laps ?? [];
  const waiting = Array.from(
    { length: Math.max(0, laps.planned - done - 1) },
    (_, i) => done + i + 2
  );
  const removable = (n: number): Removable =>
    removeLap === null
      ? {}
      : {
          selected: selected === n,
          onSelect: () => setSelected(selected === n ? null : n),
          onRemove: () => {
            removeLap();
            setSelected(null);
            onLapRemoved(n);
          },
        };
  const next = laps.next;
  return (
    <>
      {laps.rows.map((_, i) => (
        <LapRow key={i} n={i + 1} value={lapAmount(plan, amounts[i] ?? 0)} />
      ))}
      {laps.rest !== null &&
        ("running" in laps.rest ? (
          <RestRow
            rest={laps.rest.running}
            left={laps.rest.left}
            onMore={laps.moreRest}
            onSkip={laps.skipRest}
          />
        ) : (
          <IdleRestRow seconds={laps.rest.seconds} onStart={laps.startRest} />
        ))}
      {next !== null &&
        (step !== null ? (
          <SetRow
            position={String(done + 1)}
            label={next.label}
            trailing={
              <button
                type="button"
                className="detail-primary lap-go"
                onClick={() => {
                  laps.attemptAt(step);
                  setStep(null);
                }}
              >
                {t("common.save")}
              </button>
            }
          >
            <span className="lap-attempt">{t("tally.attempt")}</span>
            <span className="lap-step">
              <Stepper
                compact
                onStep={(d) => setStep(Math.min(plan.target - 1, Math.max(0, step + d)))}
                decreaseLabel={t("tally.fewerMoves")}
                increaseLabel={t("tally.moreMoves")}
              >
                <span className="lap-step-value">{`${step}/${plan.target}`}</span>
              </Stepper>
            </span>
          </SetRow>
        ) : next.startable ? (
          <SetRow
            position={String(done + 1)}
            label={next.label}
            trailing={
              <button type="button" className="outline-button lap-go" onClick={laps.startLap}>
                {t("tally.startLap")}
              </button>
            }
          >
            {null}
          </SetRow>
        ) : (
          <SetRow
            position={String(done + 1)}
            label={next.label}
            removeLabel={t("tally.removeLapOf", { lap: done + 1 })}
            {...removable(done + 1)}
          >
            <span className="lap-now">{next.text}</span>
          </SetRow>
        ))}
      {next !== null && step === null && !next.startable && (
        <div className="climb-goes">
          <button
            type="button"
            className="outline-button"
            disabled={laps.off}
            onClick={() => {
              if (laps.timed) laps.fell();
              else setStep(0);
            }}
          >
            {t("tally.attempt")}
          </button>
          <button type="button" className="detail-primary" disabled={laps.off} onClick={laps.sent}>
            {t("common.sent")}
          </button>
        </div>
      )}
      {waiting.map((n) => (
        <Waiting key={n} n={n} {...removable(n)} />
      ))}
      <button type="button" className="outline-button exercise-block-add" onClick={laps.addLap}>
        <Icon name="plus" size={16} strokeWidth={2.4} />
        {t("tally.addLap")}
      </button>
    </>
  );
}

/** A circuit exercise as a row per lap: what each was, the lap on the wall, and + Add lap. */
export function LapsCard({
  item,
  at,
  logged,
  planned,
  draft,
  live,
  rest,
  now,
  unit,
  about,
  history,
  onFold,
  menu,
  onLapRemoved,
}: LapsCardProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const plan = lapPlanOf(at.dose);
  const active = draft?.exercise?.item === item;
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={exerciseName(at.exercise)}
          target={targetText(at.dose, "laps", unit, { sessionRpe })}
          about={about}
          {...(history !== undefined && { history })}
          onFold={onFold}
          menu={menu}
        />
      }
    >
      {active && draft !== null ? (
        <LiveLaps
          draft={draft}
          live={live}
          rest={rest}
          now={now}
          plan={plan}
          onLapRemoved={onLapRemoved}
        />
      ) : (
        <div>
          {logged.map((s, i) => (
            <LapRow key={i} n={i + 1} value={lapAmount(plan, s.reps ?? s.onS ?? 0)} />
          ))}
          {Array.from({ length: Math.max(0, planned - logged.length) }, (_, i) => (
            <Waiting key={`w${i}`} n={logged.length + i + 1} />
          ))}
        </div>
      )}
    </ExerciseBlock>
  );
}

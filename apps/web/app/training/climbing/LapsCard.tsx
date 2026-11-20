import React from "react";
import { clock, type SessionItem, type SetDone } from "@sendtally/core/hang";
import { lapPlanOf } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import {
  enduranceAmountLabel,
  lapRowsOf,
  useLapsTally,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import type { RestClock } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import type { MoreMenuItem } from "../../components/MoreMenu";
import type { About } from "../components/AboutButton";
import { ExerciseCardHead } from "../players/ExerciseCardHead";
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
  about?: About | undefined;
  onFold: () => void;
  menu: readonly MoreMenuItem[];
  /** A lap still to climb was taken out, for its Undo. */
  onLapRemoved: (lap: number) => void;
};

function LapRow({
  n,
  share,
  clean,
  value,
}: {
  n: number;
  share: number;
  clean: boolean;
  value: string;
}): React.ReactElement {
  return (
    <div className="climb-row" aria-label={`${t("tally.lapLabel", { lap: n })}, ${value}`}>
      <span className="climb-set">{n}</span>
      <span className="lap-bar">
        <span
          className={clean ? "lap-fill" : "lap-fill lap-fill--short"}
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </span>
      <span className="lap-value">{value}</span>
    </div>
  );
}

function RemoveLap({ n, onRemove }: { n: number; onRemove: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      className="set-remove set-remove--run"
      aria-label={t("tally.removeLapOf", { lap: n })}
      onClick={onRemove}
    >
      <Icon name="minusCircle" size={24} strokeWidth={1.5} />
    </button>
  );
}

/** The lap on the wall: Attempt or Sent, and an Attempt asks in the row how far it got. */
function LiveLaps({
  draft,
  live,
  rest,
  now,
  target,
  lapText,
  onLapRemoved,
}: {
  draft: LogSessionDraft;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  target: number;
  lapText: string;
  onLapRemoved: (lap: number) => void;
}): React.ReactElement | null {
  const laps = useLapsTally(draft, live, rest, now);
  const [stepAt, setStepAt] = React.useState<{ lap: number; n: number } | null>(null);
  if (laps === null) return null;
  const done = laps.rows.length;
  const step = stepAt?.lap === done ? stepAt.n : null;
  const setStep = (n: number | null): void => setStepAt(n === null ? null : { lap: done, n });
  const removeLap = laps.removeLap;
  const remove =
    removeLap === null
      ? null
      : (n: number) => () => {
          removeLap();
          onLapRemoved(n);
        };
  const waiting = Array.from(
    { length: Math.max(0, laps.planned - done - 1) },
    (_, i) => done + i + 2
  );
  return (
    <>
      {laps.rows.map((row, i) => (
        <LapRow key={i} n={i + 1} share={row.share} clean={row.clean} value={row.value} />
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
      {laps.next !== null && (
        <div className="climb-row climb-row--current">
          <span className="climb-set">{done + 1}</span>
          {step !== null ? (
            <>
              <span className="climb-note">{t("tally.attempt")}</span>
              <span className="lap-step">
                <button
                  type="button"
                  className="lap-step-button"
                  aria-label={t("tally.fewerMoves")}
                  onClick={() => setStep(Math.max(0, step - 1))}
                >
                  −
                </button>
                <span className="lap-step-value">{`${step}/${target}`}</span>
                <button
                  type="button"
                  className="lap-step-button"
                  aria-label={t("tally.moreMoves")}
                  onClick={() => setStep(Math.min(target - 1, step + 1))}
                >
                  +
                </button>
              </span>
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
            </>
          ) : laps.next.startable ? (
            <button
              type="button"
              className="outline-button lap-go lap-start"
              onClick={laps.startLap}
            >
              {t("tally.startLap")}
            </button>
          ) : (
            <>
              <span className="climb-note lap-now">{laps.next.text}</span>
              {remove !== null && <RemoveLap n={done + 1} onRemove={remove(done + 1)} />}
            </>
          )}
        </div>
      )}
      {laps.next !== null && step === null && !laps.next.startable && (
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
        <div key={n} className="climb-row climb-row--waiting">
          <span className="climb-set">{n}</span>
          <span className="climb-note lap-now">{lapText}</span>
          {remove !== null && <RemoveLap n={n} onRemove={remove(n)} />}
        </div>
      ))}
      <button type="button" className="outline-button player-add-set" onClick={laps.addLap}>
        + {t("tally.addLap")}
      </button>
    </>
  );
}

/** A circuit exercise as a row per lap: how far each got, the lap on the wall, and + Add lap. */
export function LapsCard({
  item,
  at,
  logged,
  planned,
  draft,
  live,
  rest,
  now,
  about,
  onFold,
  menu,
  onLapRemoved,
}: LapsCardProps): React.ReactElement {
  const plan = lapPlanOf(at.dose);
  const active = draft?.exercise?.item === item;
  const lapText = enduranceAmountLabel({ ...plan, laps: [] }, plan.target);
  return (
    <section className="player-card">
      <ExerciseCardHead item={at} about={about} onFold={onFold} menu={menu} />
      <div className="climb-row climb-row--head" aria-hidden="true">
        <span className="climb-col train-label climb-col-set">{t("workouts.colLap")}</span>
        <span className="climb-col train-label">
          {plan.unit === "moves"
            ? t("workouts.movesPerLap", { n: plan.target })
            : t("workouts.timePerLap", { time: clock(plan.target) })}
        </span>
      </div>
      {active && draft !== null ? (
        <LiveLaps
          draft={draft}
          live={live}
          rest={rest}
          now={now}
          target={plan.target}
          lapText={lapText}
          onLapRemoved={onLapRemoved}
        />
      ) : (
        <div>
          {lapRowsOf(logged, plan).map((row, i) => (
            <LapRow key={i} n={i + 1} {...row} />
          ))}
          {Array.from({ length: Math.max(0, planned - logged.length) }, (_, i) => (
            <div key={`w${i}`} className="climb-row climb-row--waiting">
              <span className="climb-set">{logged.length + i + 1}</span>
              <span className="climb-note lap-now">{lapText}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

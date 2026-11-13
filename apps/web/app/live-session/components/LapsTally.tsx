import React from "react";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  useLapsTally,
  type GradePrefs,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import type { RestClock } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { useGoBack } from "../../lib/useGoBack";
import { IdleRestRow } from "../../training/players/IdleRestRow";
import { RestRow } from "../../training/players/RestRow";
import { LiveClimbEditor } from "./LiveClimbEditor";

export type LapsTallyProps = {
  draft: LogSessionDraft;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  gymName: string;
  prefs: GradePrefs;
  vocabulary: ClimbVocabulary;
  gyms: readonly Gym[];
  onDone: () => void;
};

/**
 * A workout's circuit laps as they happen, one line per lap like sets: how far each got and the
 * rest after it, which starts on play. A moves lap ends on Sent, or Fell and how far it got; a
 * time lap counts on the wall and goes clean at its target, Fell keeping the time so far.
 */
export function LapsTally({
  draft,
  live,
  rest,
  now,
  gymName,
  prefs,
  vocabulary,
  gyms,
  onDone,
}: LapsTallyProps): React.ReactElement | null {
  const leave = useGoBack("/app");
  const [editing, setEditing] = React.useState(false);
  const laps = useLapsTally(draft, live, rest, now);
  if (laps === null) return null;
  const { circuit } = laps;
  return (
    <div className="tally">
      <div className="tally-column">
        <div className="tally-head">
          <button
            type="button"
            className="tally-minimise"
            aria-label={t("tally.minimise")}
            onClick={leave}
          >
            <Icon name="chevron" size={20} strokeWidth={2.2} />
          </button>
          <span className="tally-gym">
            <span className="tally-gym-name">{gymName}</span>
          </span>
          <button type="button" className="tally-finish" onClick={onDone}>
            {t("common.done")}
          </button>
        </div>
        <div className="tally-clock">
          <span className="tally-time">{laps.clock}</span>
          <span className="tally-summary">{laps.line}</span>
        </div>
        <div className="tally-list">
          {laps.rows.map((row, i) => (
            <button
              key={i}
              type="button"
              className="lap-row"
              aria-label={`${row.label}, ${row.value}`}
              onClick={() => setEditing(true)}
            >
              <span className="lap-label">{row.label}</span>
              <span className="lap-bar">
                <span
                  className={row.clean ? "lap-fill lap-fill--clean" : "lap-fill"}
                  style={{ width: `${Math.round(row.share * 100)}%` }}
                />
              </span>
              <span className="lap-value">{row.value}</span>
              <span className="lap-took">{row.took}</span>
            </button>
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
            <div className="lap-row lap-row--next">
              <span className="lap-label">{laps.next.label}</span>
              {laps.next.startable ? (
                <button type="button" className="tally-finish lap-start" onClick={laps.startLap}>
                  {t("tally.startLap")}
                </button>
              ) : (
                <span className="lap-next">{laps.next.text}</span>
              )}
            </div>
          )}
          <button type="button" className="tally-finish laps-add" onClick={laps.addLap}>
            {t("tally.addLap")}
          </button>
        </div>
        <div className="tally-controls">
          <div className="tally-goes">
            <button
              type="button"
              className="tally-fell"
              disabled={laps.off}
              onClick={() => setEditing(laps.fell())}
            >
              {t("tally.fell")}
            </button>
            {!laps.timed && (
              <button
                type="button"
                className="tally-sent-button"
                disabled={laps.done}
                onClick={laps.sent}
              >
                {t("common.sent")}
              </button>
            )}
          </div>
        </div>
      </div>
      <LiveClimbEditor
        climb={editing ? (circuit ?? null) : null}
        index={circuit === undefined ? 0 : draft.climbs.indexOf(circuit)}
        count={draft.climbs.length}
        prefs={prefs}
        vocabulary={vocabulary}
        gyms={gyms}
        onChange={(c) => live.updateClimb(c.key, () => c)}
        onRemove={() => {
          if (circuit !== undefined)
            live.replace({ ...draft, climbs: draft.climbs.filter((c) => c !== circuit) });
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}

import React from "react";
import { Link } from "react-router";
import { gymOfDraft, useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { tallyElapsedSeconds, tallySummary, useLiveSession } from "@sendtally/features/log-session";
import { liveRunSummary, runElapsedSeconds, useLiveRun } from "@sendtally/features/workouts";
import { LIVE_PATH, runPath } from "../live-session/startLive";
import { useAppApi } from "../lib/useAppApi";
import { useLiveRunStore } from "../lib/useLiveRun";
import { useLiveSessionStorage } from "../lib/useLiveSessionStorage";
import { Icon } from "./Icon";
import { LiveClock } from "./LiveClock";
import { RestStrip } from "./RestStrip";

type Live = {
  name: string;
  summary: string;
  elapsed: (now: Date) => number;
  open: string;
  stop: string;
  stopLabel: string;
};

/** The climbing session or workout running, folded down: click to open it, stop to end it. */
export function LiveBar(): React.ReactElement | null {
  const session = useLiveSession(useLiveSessionStorage());
  const run = useLiveRun(useLiveRunStore());
  const gyms = useGyms(useAppApi());
  const draft = session.stored?.draft;
  const live: Live | null =
    draft !== undefined
      ? {
          name: gymOfDraft(gyms.gyms, draft.gymId)?.name ?? t("gyms.noGym"),
          summary: tallySummary(draft),
          elapsed: (now) => tallyElapsedSeconds(draft, now),
          open: LIVE_PATH,
          stop: `${LIVE_PATH}?finish=1`,
          stopLabel: t("tally.finishSession"),
        }
      : run !== null
        ? {
            name: run.title,
            summary: liveRunSummary(run),
            elapsed: (now) => runElapsedSeconds(run.startedAt, now),
            open: runPath(run),
            stop: runPath(run, true),
            stopLabel: t("hang.end"),
          }
        : null;
  if (live === null) return null;
  return (
    <div className="live-bar-wrap">
      <div className="live-bar">
        <Link to={live.open} className="live-bar-open" aria-label={`${live.name}, ${live.summary}`}>
          <span className="live-bar-dot" />
          <span className="live-bar-text">
            <span className="live-bar-name">{live.name}</span>
            <span className="live-bar-summary">{live.summary}</span>
          </span>
          <LiveClock elapsed={live.elapsed} className="live-bar-clock" />
        </Link>
        <Link to={live.stop} className="live-bar-stop" aria-label={live.stopLabel}>
          <Icon name="stop" size={22} strokeWidth={2.2} />
        </Link>
      </div>
      {draft === undefined && <RestStrip />}
    </div>
  );
}

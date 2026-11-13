import React from "react";
import { Link } from "react-router";
import { gymOfDraft, useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { tallyElapsedSeconds, tallySummary, useLiveSession } from "@sendtally/features/log-session";
import { LIVE_PATH } from "../live-session/startLive";
import { useAppApi } from "../lib/useAppApi";
import { useLiveSessionStorage } from "../lib/useLiveSessionStorage";
import { Icon } from "./Icon";
import { LiveClock } from "./LiveClock";

/** The climbing session running, folded down: click to open it, stop to finish it. */
export function LiveBar(): React.ReactElement | null {
  const session = useLiveSession(useLiveSessionStorage());
  const gyms = useGyms(useAppApi());
  const draft = session.stored?.draft;
  if (draft === undefined) return null;
  const name = gymOfDraft(gyms.gyms, draft.gymId)?.name ?? t("gyms.noGym");
  const summary = tallySummary(draft);
  return (
    <div className="live-bar">
      <Link to={LIVE_PATH} className="live-bar-open" aria-label={`${name}, ${summary}`}>
        <span className="live-bar-dot" />
        <span className="live-bar-text">
          <span className="live-bar-name">{name}</span>
          <span className="live-bar-summary">{summary}</span>
        </span>
        <LiveClock elapsed={(now) => tallyElapsedSeconds(draft, now)} className="live-bar-clock" />
      </Link>
      <Link
        to={`${LIVE_PATH}?finish=1`}
        className="live-bar-stop"
        aria-label={t("tally.finishSession")}
      >
        <Icon name="stop" size={22} strokeWidth={2.2} />
      </Link>
    </div>
  );
}

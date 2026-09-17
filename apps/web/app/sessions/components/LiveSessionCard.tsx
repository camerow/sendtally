import React from "react";
import { Link } from "react-router";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import {
  durationLabel,
  elapsedLabel,
  idleMinutes,
  wantsWrapUpReminder,
  type StoredSessionDraft,
} from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { ClimbLedgerRow } from "../../log-session/components/ClimbLedgerRow";

const OPEN_SESSION = "/app/sessions/new?resume=1";
const WRAP_UP = "/app/sessions/new?resume=1&wrapUp=1";

function useSecondClock(): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function ReminderBar({
  stored,
  now,
}: {
  stored: StoredSessionDraft;
  now: Date;
}): React.ReactElement {
  const idle = idleMinutes(stored.draft, now);
  const meta =
    idle === null
      ? t("sessions.idleSinceYesterday", {
          date: formatDate(stored.savedAt, { weekday: "long", day: "numeric", month: "short" }),
        })
      : t("sessions.idleFor", { duration: durationLabel(idle) });
  return (
    <div className="live-reminder">
      <span className="live-reminder-text">
        <span className="live-reminder-title">{t("sessions.stillClimbing")}</span>
        <span className="live-reminder-meta">{meta}</span>
      </span>
      <Link to={WRAP_UP} className="live-wrap-up">
        {t("sessions.wrapUp")}
      </Link>
    </div>
  );
}

export type LiveSessionCardProps = {
  stored: StoredSessionDraft;
  vocabulary: ClimbVocabulary;
  gym: Gym | null;
  onEditClimb: (key: string) => void;
  onChangeTries: (key: string, tries: number) => void;
};

/** The session being climbed right now, pinned above the log until it is wrapped up. */
export function LiveSessionCard({
  stored,
  vocabulary,
  gym,
  onEditClimb,
  onChangeTries,
}: LiveSessionCardProps): React.ReactElement {
  const now = useSecondClock();
  const { draft, savedAt } = stored;
  const title = draft.name.trim() === "" ? t("sessions.unfinishedSession") : draft.name;
  const meta = [
    t("sessions.liveMeta", { elapsed: elapsedLabel(draft, now) }),
    ...(gym === null ? [] : [gym.name]),
  ].join(" · ");

  return (
    <div className="live-session">
      {wantsWrapUpReminder(draft, now) && <ReminderBar stored={stored} now={now} />}
      <div className="live-session-body">
        <Link to={OPEN_SESSION} className="live-session-row" aria-label={`${title}, ${meta}`}>
          <span className="session-row-date">
            <span className="session-row-weekday">{formatDate(savedAt, { weekday: "short" })}</span>
            <span className="session-row-day">{formatDate(savedAt, { day: "numeric" })}</span>
          </span>
          <span className="session-row-main">
            <span className="session-row-title">{title}</span>
            <span className="session-row-meta live-session-meta">
              <span className="live-session-dot" />
              <span className="live-session-meta-text">{meta}</span>
            </span>
          </span>
          <span className="live-session-chevron">
            <Icon name="chevron" size={14} strokeWidth={2} />
          </span>
        </Link>
        {draft.climbs.length > 0 && (
          <div className="live-session-ledger">
            {draft.climbs.map((climb) => (
              <ClimbLedgerRow
                key={climb.key}
                climb={climb}
                project={climb.project ?? vocabulary.isProject(climb.name)}
                onPress={() => onEditClimb(climb.key)}
                onChangeTries={(tries) => onChangeTries(climb.key, tries)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

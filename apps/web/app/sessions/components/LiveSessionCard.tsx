import React from "react";
import { Link } from "react-router";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import {
  durationLabel,
  idleMinutes,
  wantsWrapUpReminder,
  type StoredSessionDraft,
} from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { DiscardDraftDialog } from "../../components/DiscardDraftDialog";
import { Icon } from "../../components/Icon";
import { ClimbLedgerRow } from "../../log-session/components/ClimbLedgerRow";

const WRAP_UP = "/app/sessions/new?resume=1";

function useMinuteClock(): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
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
      <Link to={WRAP_UP} className="live-wrap-up live-wrap-up--gold">
        {t("sessions.wrapUp")}
      </Link>
    </div>
  );
}

export type LiveSessionCardProps = {
  stored: StoredSessionDraft;
  vocabulary: ClimbVocabulary;
  onEditClimb: (key: string) => void;
  onDiscard: () => void;
};

/** The session being climbed right now, pinned above the log until it is wrapped up. */
export function LiveSessionCard({
  stored,
  vocabulary,
  onEditClimb,
  onDiscard,
}: LiveSessionCardProps): React.ReactElement {
  const now = useMinuteClock();
  const [confirming, setConfirming] = React.useState(false);
  const { draft, savedAt } = stored;
  const title = draft.name.trim() === "" ? t("sessions.unfinishedSession") : draft.name;
  const meta = t("sessions.liveMeta", { start: draft.startTime });

  return (
    <div className="live-session">
      {wantsWrapUpReminder(draft, now) && <ReminderBar stored={stored} now={now} />}
      <div className="live-session-body">
        <div className="live-session-head">
          <Link
            to={WRAP_UP}
            className="live-session-row"
            aria-label={`${title}, ${meta}, ${t("sessions.wrapUp")}`}
          >
            <span className="session-row-date">
              <span className="session-row-weekday">
                {formatDate(savedAt, { weekday: "short" })}
              </span>
              <span className="session-row-day">{formatDate(savedAt, { day: "numeric" })}</span>
            </span>
            <span className="session-row-main">
              <span className="session-row-title">{title}</span>
              <span className="session-row-meta live-session-meta">
                <span className="live-session-dot" />
                {meta}
              </span>
            </span>
          </Link>
          <Link to={WRAP_UP} className="live-wrap-up">
            {t("sessions.wrapUp")}
          </Link>
        </div>
        {draft.climbs.length > 0 && (
          <div className="live-session-ledger">
            {draft.climbs.map((climb) => (
              <ClimbLedgerRow
                key={climb.key}
                climb={climb}
                project={climb.project ?? vocabulary.isProject(climb.name)}
                onPress={() => onEditClimb(climb.key)}
              />
            ))}
          </div>
        )}
        <button type="button" onClick={() => setConfirming(true)} className="live-session-discard">
          <Icon name="x" size={12} strokeWidth={2.2} />
          {t("sessions.discardSession")}
        </button>
      </div>
      {confirming && (
        <DiscardDraftDialog
          stored={stored}
          onCancel={() => setConfirming(false)}
          onDiscard={() => {
            setConfirming(false);
            onDiscard();
          }}
        />
      )}
    </div>
  );
}

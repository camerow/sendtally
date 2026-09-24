import React from "react";
import { Link } from "react-router";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import type { LiveSyncStatus, StoredSessionDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { ClimbLedgerRow } from "../../log-session/components/ClimbLedgerRow";

function syncLabel(status: LiveSyncStatus): string {
  if (status === "saving") return t("sessions.saving");
  if (status === "failed") return t("sessions.notSavedYet");
  return t("sessions.savedAsYouGo");
}

export type LiveSessionCardProps = {
  stored: StoredSessionDraft;
  status: LiveSyncStatus;
  vocabulary: ClimbVocabulary;
  gym: Gym | null;
  onEditClimb: (key: string) => void;
  onChangeTries: (key: string, tries: number) => void;
  onToggleSent: (key: string) => void;
};

/** The session being climbed right now, pinned above the log while it is saved as it goes. */
export function LiveSessionCard({
  stored,
  status,
  vocabulary,
  gym,
  onEditClimb,
  onChangeTries,
  onToggleSent,
}: LiveSessionCardProps): React.ReactElement {
  const { draft, savedAt, fingerprint } = stored;
  const title = draft.name.trim() === "" ? t("sessions.unfinishedSession") : draft.name;
  const meta = [syncLabel(status), ...(gym === null ? [] : [gym.name])].join(" · ");
  const label = `${title}, ${meta}`;
  const header = (
    <>
      <span className="session-row-date">
        <span className="session-row-day">{formatDate(savedAt, { day: "numeric" })}</span>
        <span className="session-row-weekday">{formatDate(savedAt, { weekday: "short" })}</span>
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
    </>
  );

  return (
    <div className="live-session">
      <div className="live-session-body">
        <div className="live-session-head">
          {fingerprint === undefined ? (
            <span className="live-session-row" aria-label={label}>
              {header}
            </span>
          ) : (
            <Link
              to={`/app/sessions/${fingerprint}`}
              className="live-session-row"
              aria-label={label}
            >
              {header}
            </Link>
          )}
          {fingerprint === undefined ? (
            <button type="button" className="live-add-details" disabled>
              {t("sessions.addDetails")}
            </button>
          ) : (
            <Link to={`/app/sessions/${fingerprint}/edit`} className="live-add-details">
              {t("sessions.addDetails")}
            </Link>
          )}
        </div>
        {draft.climbs.length > 0 && (
          <div className="live-session-ledger">
            {draft.climbs.map((climb) => (
              <ClimbLedgerRow
                key={climb.key}
                climb={climb}
                project={climb.project ?? vocabulary.isProject(climb.name)}
                onPress={() => onEditClimb(climb.key)}
                onChangeTries={(tries) => onChangeTries(climb.key, tries)}
                onToggleSent={() => onToggleSent(climb.key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

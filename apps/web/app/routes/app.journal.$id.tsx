import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Link, redirect, useLoaderData, useNavigate } from "react-router";
import type { EntryDetail, JournalEntry, SessionRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import {
  dayLabel,
  daysSince,
  entryHasTitle,
  entryKindLabel,
  entryTitle,
  entryWhen,
  linkedSessions,
  sessionsInSpan,
  sessionsNearPoints,
  severitySeries,
} from "@sendtally/features/journal";
import { sessionTitle } from "@sendtally/features/sessions";
import { SessionRowItem } from "../sessions/components/SessionRowItem";
import { BackLink } from "../components/BackLink";
import { SeverityChart } from "../journal/components/SeverityChart";
import { TripDetail } from "../journal/components/TripDetail";
import journalStyles from "../journal/journal.css?url";
import sessionsStyles from "../sessions/sessions.css?url";
import { cloudflareContext } from "../lib/cloudflare-context";
import { orNotFound, requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: journalStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<{
  apiUrl: string;
  entry: EntryDetail;
  sessions: SessionRow[];
  entries: JournalEntry[];
}> {
  const api = await requireApi(args);
  const id = args.params["id"] ?? "";
  const [{ entry }, { sessions }, { entries }] = await Promise.all([
    orNotFound(api.entry(id)),
    api.sessions(),
    api.entries(),
  ]);
  // An update is read on its thread, never on a page of its own.
  if (entry.parent_id !== null) {
    throw redirect(`/app/journal/${encodeURIComponent(entry.parent_id)}`);
  }
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL, entry, sessions, entries };
}

export default function EntryDetailRoute(): React.ReactElement {
  const { apiUrl, entry, sessions, entries } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const navigate = useNavigate();
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const titled = entryHasTitle(entry);
  const dayCount =
    entry.kind === "injury" && entry.status === "ongoing"
      ? t("journal.dayN", { n: daysSince(entry.occurred_at) })
      : null;
  const linked = linkedSessions(sessions, entry);
  // An injury's dates match sessions rather than linking them; anything linked is not listed twice.
  const inSpan =
    entry.kind === "injury"
      ? sessionsInSpan(sessions, entry).filter((s) => !entry.fingerprints.includes(s.fingerprint))
      : [];
  const points = severitySeries(entry, entry.updates);
  const sessionsPerPoint = sessionsNearPoints(sessions, points);

  const remove = (): void => {
    setDeleting(true);
    setError(null);
    api
      .deleteEntry(entry.id)
      .then(() => navigate("/app/journal"))
      .catch(() => {
        setError(t("journal.deleteFailed"));
        setDeleting(false);
      });
  };

  return (
    <div>
      <BackLink to="/app/journal">{t("common.back")}</BackLink>

      <div className="journal-head">
        <div className="journal-head-row">
          <span className={`entry-kind entry-kind--${entry.kind}`}>
            {entryKindLabel(entry.kind)}
          </span>
          {entry.kind === "injury" && (
            <span className="entry-kind entry-kind--status">
              {t(entry.status === "resolved" ? "journal.resolved" : "journal.ongoing")}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <Link to={`/app/journal/${encodeURIComponent(entry.id)}/edit`} className="journal-action">
            {t("common.edit")}
          </Link>
          <button type="button" onClick={remove} disabled={deleting} className="journal-action">
            {deleting ? t("common.deleting") : t("common.delete")}
          </button>
        </div>
        <h1 className="journal-title">{titled ? entryTitle(entry) : entryWhen(entry)}</h1>
        {(titled || dayCount !== null) && (
          <span className="journal-meta">
            {[titled ? entryWhen(entry) : null, dayCount].filter(Boolean).join(" · ")}
          </span>
        )}
        {entry.tags.length > 0 && (
          <span className="session-row-tags">
            {entry.tags.map((tag) => (
              <span key={tag.id} className="session-row-tag">
                {tag.name}
              </span>
            ))}
          </span>
        )}
        {error !== null && <span className="journal-error">{error}</span>}
      </div>

      {entry.body.trim() !== "" && <p className="journal-body">{entry.body.trim()}</p>}

      {linked.length > 0 && (
        <div className="journal-card">
          <span className="journal-card-label">
            {t("journal.sessionCount", { count: linked.length })}
          </span>
          <div className="sessions-rows">
            {linked.map((session) => (
              <SessionRowItem
                key={session.fingerprint}
                session={session}
                title={sessionTitle(session)}
              />
            ))}
          </div>
        </div>
      )}

      {inSpan.length > 0 && (
        <div className="journal-card">
          <span className="journal-card-label">
            {t("journal.sessionsInSpan", { count: inSpan.length })}
          </span>
          <div className="sessions-rows">
            {inSpan.map((session) => (
              <SessionRowItem
                key={session.fingerprint}
                session={session}
                title={sessionTitle(session)}
              />
            ))}
          </div>
        </div>
      )}

      {entry.kind === "trip" && <TripDetail trip={entry} sessions={sessions} entries={entries} />}

      {entry.kind === "injury" && (
        <div className="journal-card">
          <div className="journal-head-row">
            <span className="journal-card-label">
              {t("journal.howItFeels")} · {t("journal.severityScale")}
            </span>
            <div style={{ flex: 1 }} />
            <Link
              to={`/app/journal/new?kind=journal&parent=${encodeURIComponent(entry.id)}`}
              className="journal-action"
            >
              {t("journal.addUpdate")}
            </Link>
          </div>
          <SeverityChart points={points} sessionsPerPoint={sessionsPerPoint} />
          {entry.updates.length === 0 && (
            <span className="journal-muted">{t("journal.noUpdatesYet")}</span>
          )}
          {[...entry.updates].reverse().map((update) => (
            <div key={update.id} className="journal-update">
              <span className="journal-update-date">{dayLabel(update.occurred_at)}</span>
              <div className="journal-update-body">
                {update.severity !== null && (
                  <span className="entry-severity">
                    {t("journal.severityValue", { n: update.severity })}
                  </span>
                )}
                <p className="journal-body">{update.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Link, redirect, useLoaderData, useNavigate } from "react-router";
import type { EntryDetail, SessionRow } from "@sendtally/api-client";
import { formatDate, t } from "@sendtally/features/i18n";
import {
  dayLabel,
  daysSince,
  entryKindLabel,
  entryTitle,
  isoDay,
  linkedSessions,
  sessionsInSpan,
  severitySeries,
  spanLabel,
  spansDates,
} from "@sendtally/features/journal";
import { sessionTitle } from "@sendtally/features/sessions";
import { SessionRowItem } from "../sessions/components/SessionRowItem";
import { BackLink } from "../components/BackLink";
import { SeverityChart } from "../journal/components/SeverityChart";
import journalStyles from "../journal/journal.css?url";
import sessionsStyles from "../sessions/sessions.css?url";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: journalStyles },
];

export async function loader(
  args: LoaderFunctionArgs
): Promise<{ apiUrl: string; entry: EntryDetail; sessions: SessionRow[] }> {
  const api = await requireApi(args);
  const id = args.params["id"] ?? "";
  const [{ entry }, { sessions }] = await Promise.all([api.entry(id), api.sessions()]);
  // An update is read on its thread, never on a page of its own.
  if (entry.parent_id !== null) {
    throw redirect(`/app/journal/${encodeURIComponent(entry.parent_id)}`);
  }
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL, entry, sessions };
}

export default function EntryDetailRoute(): React.ReactElement {
  const { apiUrl, entry, sessions } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const navigate = useNavigate();
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const spanning = spansDates(entry.kind);
  const linked = linkedSessions(sessions, entry);
  // A trip is a date range, so sessions inside it are matched rather than linked;
  // anything already linked is not listed twice.
  const inSpan = spanning
    ? sessionsInSpan(sessions, entry).filter((s) => !entry.fingerprints.includes(s.fingerprint))
    : [];
  const points = severitySeries(entry, entry.updates);
  const sessionsPerPoint = points.map(
    (point) =>
      sessions.filter((s) => {
        const day = isoDay(s.start_at);
        const from = new Date(`${point.at}T00:00:00Z`);
        from.setUTCDate(from.getUTCDate() - 6);
        return day <= point.at && day >= from.toISOString().slice(0, 10);
      }).length
  );

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
        <h1 className="journal-title">{entryTitle(entry)}</h1>
        <span className="journal-meta">
          {spanning
            ? spanLabel(entry.occurred_at, entry.ends_at)
            : formatDate(new Date(`${entry.occurred_at}T00:00:00Z`), {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
          {entry.kind === "injury" &&
            entry.status === "ongoing" &&
            ` · ${t("journal.dayN", { n: daysSince(entry.occurred_at) })}`}
        </span>
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

      {entry.body.trim() !== "" && <p className="journal-body">{entry.body}</p>}

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

      {spanning && inSpan.length > 0 && (
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

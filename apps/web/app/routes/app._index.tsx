import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import type {
  ConnectionStatus,
  Activity,
  HangHistoryRow,
  JournalEntry,
  SessionRow,
} from "@sendtally/api-client";
import { requireApi } from "../lib/api.server";
import { LogPage } from "../sessions/components/LogPage";
import climbsStyles from "../climbs/climbs.css?url";
import journalStyles from "../journal/journal.css?url";
import logSessionStyles from "../log-session/log-session.css?url";
import logStyles from "../sessions/log.css?url";
import sessionsStyles from "../sessions/sessions.css?url";

type LoaderData = {
  status: ConnectionStatus;
  sessions: SessionRow[];
  hangSessions: HangHistoryRow[];
  activities: Activity[];
  entries: JournalEntry[];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: journalStyles },
  { rel: "stylesheet", href: logSessionStyles },
  { rel: "stylesheet", href: climbsStyles },
  { rel: "stylesheet", href: logStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const api = await requireApi(args);
  const [status, sessions, entries] = await Promise.all([
    api.status(),
    api.sessions(),
    api.entries(),
  ]);
  return {
    status,
    sessions: sessions.sessions,
    hangSessions: sessions.hangSessions,
    activities: sessions.activities,
    entries: entries.entries,
  };
}

export default function Log(): React.ReactElement {
  const { status, sessions, hangSessions, activities, entries } = useLoaderData<typeof loader>();
  return (
    <LogPage
      status={status}
      sessions={sessions}
      hangSessions={hangSessions}
      activities={activities}
      entries={entries}
    />
  );
}

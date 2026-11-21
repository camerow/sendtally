import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import type {
  Activity,
  HangHistoryPart,
  HangHistoryRow,
  JournalEntry,
  SessionRow,
} from "@sendtally/api-client";
import { requireApi } from "../lib/api.server";
import { LogPage } from "../sessions/components/LogPage";
import climbsStyles from "../climbs/climbs.css?url";
import menuRowStyles from "../components/menu-row.css?url";
import journalStyles from "../journal/journal.css?url";
import logSessionStyles from "../log-session/log-session.css?url";
import logStyles from "../sessions/log.css?url";
import sessionsStyles from "../sessions/sessions.css?url";
import trainingStyles from "../training/training.css?url";
import blockStyles from "../training/blocks/blocks.css?url";

type LoaderData = {
  sessions: SessionRow[];
  hangSessions: HangHistoryRow[];
  hangParts: HangHistoryPart[];
  activities: Activity[];
  entries: JournalEntry[];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: journalStyles },
  { rel: "stylesheet", href: logSessionStyles },
  { rel: "stylesheet", href: climbsStyles },
  { rel: "stylesheet", href: logStyles },
  { rel: "stylesheet", href: menuRowStyles },
  { rel: "stylesheet", href: trainingStyles },
  { rel: "stylesheet", href: blockStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const api = await requireApi(args);
  const [sessions, entries] = await Promise.all([api.sessions(), api.entries()]);
  return {
    sessions: sessions.sessions,
    hangSessions: sessions.hangSessions,
    hangParts: sessions.hangParts,
    activities: sessions.activities,
    entries: entries.entries,
  };
}

export default function Log(): React.ReactElement {
  const { sessions, hangSessions, hangParts, activities, entries } = useLoaderData<typeof loader>();
  return (
    <LogPage
      sessions={sessions}
      hangSessions={hangSessions}
      hangParts={hangParts}
      activities={activities}
      entries={entries}
    />
  );
}

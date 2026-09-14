import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import type { ConnectionStatus, JournalEntry, SessionRow } from "@sendtally/api-client";
import { requireApi } from "../lib/api.server";
import { LogView } from "../sessions/components/LogView";
import sessionsStyles from "../sessions/sessions.css?url";

type LoaderData = {
  status: ConnectionStatus;
  sessions: SessionRow[];
  entries: JournalEntry[];
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: sessionsStyles }];

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const api = await requireApi(args);
  const [status, sessions, entries] = await Promise.all([
    api.status(),
    api.sessions(),
    api.entries(),
  ]);
  return { status, sessions: sessions.sessions, entries: entries.entries };
}

// The journal is the log with one filter applied - the same list, the same month
// headers and jump rail, at a URL worth pointing someone at.
export default function Journal(): React.ReactElement {
  const { status, sessions, entries } = useLoaderData<typeof loader>();
  return (
    <LogView
      status={status}
      sessions={sessions}
      entries={entries}
      scope="journal"
      basePath="/app/journal"
    />
  );
}

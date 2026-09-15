import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { ConnectionStatus, JournalEntry, SessionRow } from "@sendtally/api-client";
import { requireApi } from "../lib/api.server";
import type { LogScope } from "@sendtally/features/journal";
import { LogView } from "../sessions/components/LogView";
import journalStyles from "../journal/journal.css?url";
import sessionsStyles from "../sessions/sessions.css?url";

type LoaderData = {
  status: ConnectionStatus;
  sessions: SessionRow[];
  entries: JournalEntry[];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: journalStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const api = await requireApi(args);
  const [status, sessions, entries] = await Promise.all([
    api.status(),
    api.sessions(),
    api.entries(),
  ]);
  return { status, sessions: sessions.sessions, entries: entries.entries };
}

export default function Log(): React.ReactElement {
  const { status, sessions, entries } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const scope: LogScope = searchParams.get("show") === "sessions" ? "sessions" : "all";
  return (
    <LogView status={status} sessions={sessions} entries={entries} scope={scope} basePath="/app" />
  );
}

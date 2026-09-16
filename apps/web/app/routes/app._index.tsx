import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { ConnectionStatus, JournalEntry, SessionRow } from "@sendtally/api-client";
import { requireApi } from "../lib/api.server";
import { cloudflareContext } from "../lib/cloudflare-context";
import { LOG_SCOPES, type LogScope } from "@sendtally/features/journal";
import { LogView } from "../sessions/components/LogView";
import journalStyles from "../journal/journal.css?url";
import logSessionStyles from "../log-session/log-session.css?url";
import sessionsStyles from "../sessions/sessions.css?url";

type LoaderData = {
  apiUrl: string;
  status: ConnectionStatus;
  sessions: SessionRow[];
  entries: JournalEntry[];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: journalStyles },
  { rel: "stylesheet", href: logSessionStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const api = await requireApi(args);
  const [status, sessions, entries] = await Promise.all([
    api.status(),
    api.sessions(),
    api.entries(),
  ]);
  return {
    apiUrl: args.context.get(cloudflareContext).env.API_URL,
    status,
    sessions: sessions.sessions,
    entries: entries.entries,
  };
}

export default function Log(): React.ReactElement {
  const { apiUrl, status, sessions, entries } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const show = searchParams.get("show");
  const scope: LogScope = LOG_SCOPES.find((value) => value === show) ?? "all";
  return (
    <LogView
      apiUrl={apiUrl}
      status={status}
      sessions={sessions}
      entries={entries}
      scope={scope}
      basePath="/app"
    />
  );
}

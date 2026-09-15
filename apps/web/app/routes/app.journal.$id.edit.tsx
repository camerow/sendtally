import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import type { EntryDetail, SessionRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { draftFromEntry } from "@sendtally/features/journal";
import { BackLink } from "../components/BackLink";
import { EntryComposer } from "../journal/components/EntryComposer";
import journalStyles from "../journal/journal.css?url";
import sessionsStyles from "../sessions/sessions.css?url";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import logSessionStyles from "../log-session/log-session.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: logSessionStyles },
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: journalStyles },
];

export async function loader(
  args: LoaderFunctionArgs
): Promise<{ apiUrl: string; entry: EntryDetail; sessions: SessionRow[] }> {
  const api = await requireApi(args);
  const id = args.params["id"] ?? "";
  const [{ entry }, { sessions }] = await Promise.all([api.entry(id), api.sessions()]);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL, entry, sessions };
}

export default function EditEntry(): React.ReactElement {
  const { apiUrl, entry, sessions } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const initial = React.useMemo(() => draftFromEntry(entry), [entry]);

  return (
    <div>
      <BackLink to={`/app/journal/${encodeURIComponent(entry.id)}`}>{t("common.back")}</BackLink>
      <EntryComposer
        api={api}
        initial={initial}
        editing={entry.id}
        heading={t("journal.editEntry")}
        sessions={sessions}
      />
    </div>
  );
}

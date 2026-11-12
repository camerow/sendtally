import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { JournalEntry, SessionRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import {
  emptyEntryDraft,
  newEntryHeading,
  today,
  type EntryKind,
} from "@sendtally/features/journal";
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
): Promise<{ apiUrl: string; sessions: SessionRow[]; entries: JournalEntry[] }> {
  const api = await requireApi(args);
  const [{ sessions }, { entries }] = await Promise.all([api.sessions(), api.entries()]);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL, sessions, entries };
}

const KINDS: EntryKind[] = ["journal", "trip", "injury"];

const kindParam = (value: string | null): EntryKind =>
  KINDS.find((kind) => kind === value) ?? "journal";

// Every doorway lands here with what it already knows in the query: the date,
// sometimes the session, sometimes the kind. Nothing has to be re-stated.
export default function NewEntry(): React.ReactElement {
  const { apiUrl, sessions, entries } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const [searchParams] = useSearchParams();

  const initial = React.useMemo(() => {
    const draft = emptyEntryDraft(
      kindParam(searchParams.get("kind")),
      searchParams.get("date") ?? today()
    );
    return {
      ...draft,
      fingerprints: searchParams.getAll("session"),
      parentId: searchParams.get("parent") ?? "",
    };
  }, [searchParams]);

  // A session's Notes card adds a note, as a climb's does.
  const note = initial.fingerprints.length > 0 && initial.kind === "journal";
  const heading =
    searchParams.get("parent") !== null
      ? t("journal.addUpdate")
      : note
        ? t("climbs.addNote")
        : newEntryHeading(initial.kind);

  return (
    <div>
      <BackLink to="/app/journal">{t("common.back")}</BackLink>
      <EntryComposer
        api={api}
        initial={initial}
        heading={heading}
        {...(note && { saveLabel: t("common.save") })}
        sessions={sessions}
        entries={entries}
      />
    </div>
  );
}

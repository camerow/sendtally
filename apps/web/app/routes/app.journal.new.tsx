import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { SessionRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { emptyDraft, entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
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
): Promise<{ apiUrl: string; sessions: SessionRow[] }> {
  const api = await requireApi(args);
  const { sessions } = await api.sessions();
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL, sessions };
}

const KINDS: EntryKind[] = ["journal", "trip", "injury"];

const kindParam = (value: string | null): EntryKind =>
  KINDS.find((kind) => kind === value) ?? "journal";

// Every doorway lands here with what it already knows in the query: the date,
// sometimes the session, sometimes the kind. Nothing has to be re-stated.
export default function NewEntry(): React.ReactElement {
  const { apiUrl, sessions } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const [searchParams] = useSearchParams();

  const initial = React.useMemo(() => {
    const draft = emptyDraft(
      kindParam(searchParams.get("kind")),
      searchParams.get("date") ?? today()
    );
    return {
      ...draft,
      fingerprints: searchParams.getAll("session"),
      parentId: searchParams.get("parent") ?? "",
    };
  }, [searchParams]);

  const heading =
    searchParams.get("parent") !== null
      ? t("journal.addUpdate")
      : t("journal.newOfKind", { kind: entryKindLabel(initial.kind).toLowerCase() });

  return (
    <div>
      <BackLink to="/app/journal">{t("common.back")}</BackLink>
      <EntryComposer api={api} initial={initial} heading={heading} sessions={sessions} />
    </div>
  );
}

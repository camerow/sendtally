import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import type { SessionRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { emptyDraft, today, type EntryKind } from "@sendtally/features/journal";
import { BackLink } from "../components/BackLink";
import { EntryComposer } from "../journal/components/EntryComposer";
import journalStyles from "../journal/journal.css?url";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import logSessionStyles from "../log-session/log-session.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: logSessionStyles },
  { rel: "stylesheet", href: journalStyles },
];

export async function loader(
  args: LoaderFunctionArgs
): Promise<{ apiUrl: string; sessions: SessionRow[] }> {
  const api = await requireApi(args);
  const { sessions } = await api.sessions();
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL, sessions };
}

const KINDS: EntryKind[] = ["note", "reflection", "trip", "injury"];

const kindParam = (value: string | null): EntryKind =>
  KINDS.find((kind) => kind === value) ?? "note";

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
      fingerprint: searchParams.get("session") ?? "",
      parentId: searchParams.get("parent") ?? "",
    };
  }, [searchParams]);

  return (
    <div>
      <BackLink to="/app/journal">{t("journal.title")}</BackLink>
      <h1 className="journal-title">
        {searchParams.get("parent") === null ? t("journal.newEntry") : t("journal.addUpdate")}
      </h1>
      <EntryComposer api={api} initial={initial} sessions={sessions} />
    </div>
  );
}

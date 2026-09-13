import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useParams } from "react-router";
import { useSessionDraft } from "@sendtally/features/log-session";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import { LogSessionForm } from "../log-session/components/LogSessionForm";
import logSessionStyles from "../log-session/log-session.css?url";
import { BackLink } from "../components/BackLink";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: logSessionStyles }];

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.72)",
};

export default function EditSessionRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const fingerprint = useParams().fingerprint ?? "";
  const api = useClientApi(apiUrl);
  const state = useSessionDraft(api, fingerprint);
  const backTo = `/app/sessions/${encodeURIComponent(fingerprint)}`;

  return (
    <div>
      <BackLink to={backTo}>SESSION</BackLink>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "14px 0 26px" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 36,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          Edit session
        </h1>
        <span style={monoLabel}>EFFORT IS RE-SCORED WHEN YOU SAVE</span>
      </div>
      {state.status === "loading" && <span style={monoLabel}>LOADING…</span>}
      {state.status === "error" && (
        <span style={{ ...monoLabel, color: "var(--text-label-accent)" }}>
          Could not load this session. <Link to={backTo}>Back to the session</Link>
        </span>
      )}
      {state.status === "ready" &&
        (state.data.editable ? (
          <LogSessionForm api={api} editing={{ fingerprint, draft: state.data.draft }} />
        ) : (
          <span style={{ ...monoLabel, color: "var(--text-label-accent)" }}>
            This session was synced from a board and is kept as read-only history.{" "}
            <Link to={backTo}>Back to the session</Link>
          </span>
        ))}
    </div>
  );
}

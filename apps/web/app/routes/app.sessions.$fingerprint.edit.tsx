import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useParams } from "react-router";
import { useSessionDraft } from "@sendtally/features/log-session";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import { LogSessionForm } from "../log-session/components/LogSessionForm";
import areasStyles from "../areas/areas.css?url";
import logSessionStyles from "../log-session/log-session.css?url";
import projectsStyles from "../projects/projects.css?url";
import { BackLink } from "../components/BackLink";
import { t } from "@sendtally/features/i18n";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: logSessionStyles },
  { rel: "stylesheet", href: projectsStyles },
  { rel: "stylesheet", href: areasStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.72)",
};

/** Inside the form (with a summary) the form's own gap spaces it; before it loads, the margin does. */
function EditHeader({ summary }: { summary?: string }): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        margin: summary === undefined ? "14px 0 26px" : "14px 0 0",
      }}
    >
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
        {t("logSession.editTitle")}
      </h1>
      {summary !== undefined && <span style={monoLabel}>{summary}</span>}
    </div>
  );
}

export default function EditSessionRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const fingerprint = useParams().fingerprint ?? "";
  const api = useClientApi(apiUrl);
  const state = useSessionDraft(api, fingerprint);
  const backTo = `/app/sessions/${encodeURIComponent(fingerprint)}`;

  return (
    <div>
      <BackLink to={backTo}>{t("sessionDetail.backSession")}</BackLink>
      {!(state.status === "ready" && state.data.editable) && <EditHeader />}
      {state.status === "loading" && <span style={monoLabel}>{t("common.loading")}</span>}
      {state.status === "error" && (
        <span style={{ ...monoLabel, textTransform: "none", color: "var(--text-label-accent)" }}>
          {t("sessionDetail.loadFailed")}{" "}
          <Link to={backTo}>{t("sessionDetail.backToSession")}</Link>
        </span>
      )}
      {state.status === "ready" &&
        (state.data.editable ? (
          <LogSessionForm
            api={api}
            editing={{ fingerprint, draft: state.data.draft }}
            header={(summary) => <EditHeader summary={summary} />}
          />
        ) : (
          <span style={{ ...monoLabel, color: "var(--text-label-accent)" }}>
            {t("sessions.readOnlyBoard")}{" "}
            <Link to={backTo}>{t("sessionDetail.backToSession")}</Link>
          </span>
        ))}
    </div>
  );
}

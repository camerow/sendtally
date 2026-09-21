import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import { sessionDraftStorage } from "../lib/sessionDraftStorage";
import { useHydrated } from "../lib/useHydrated";
import { storedDraft } from "@sendtally/features/log-session";
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

export default function LogSessionRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const hydrated = useHydrated();
  const [searchParams] = useSearchParams();
  const resumed =
    hydrated && searchParams.get("resume") === "1" ? storedDraft(sessionDraftStorage) : null;
  const title =
    resumed === null
      ? t("common.logASession")
      : searchParams.get("wrapUp") === "1"
        ? t("logSession.wrapUpTitle")
        : resumed.name.trim() || t("sessions.unfinishedSession");

  return (
    <div>
      <BackLink to="/app">{t("journal.log")}</BackLink>
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
          {title}
        </h1>
        {resumed !== null && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(64,63,76,0.55)",
            }}
          >
            {t("logSession.wrapUpSubtitle")}
          </span>
        )}
      </div>
      {/* The session starts on the visitor's clock, so the form waits for their browser. */}
      {hydrated && <LogSessionForm api={api} />}
    </div>
  );
}

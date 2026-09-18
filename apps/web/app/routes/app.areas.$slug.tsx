import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Navigate, redirect, useLoaderData } from "react-router";
import type { AreaPage } from "@sendtally/api-client";
import { useArea } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { AreaPageView } from "../areas/components/AreaPageView";
import areasStyles from "../areas/areas.css?url";
import { orNotFound, requireApi } from "../lib/api.server";
import { cloudflareContext } from "../lib/cloudflare-context";
import { useClientApi } from "../lib/useClientApi";
import projectsStyles from "../projects/projects.css?url";
import sessionsStyles from "../sessions/sessions.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: projectsStyles },
  { rel: "stylesheet", href: areasStyles },
];

export async function loader(
  args: LoaderFunctionArgs
): Promise<{ apiUrl: string; slug: string; page: AreaPage }> {
  const api = await requireApi(args);
  const slug = args.params["slug"] ?? "";
  const page = await orNotFound(api.area(slug));
  if ("redirect" in page) throw redirect(`/app/areas/${encodeURIComponent(page.redirect)}`, 301);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL, slug, page };
}

export default function AreaRoute(): React.ReactElement {
  const { apiUrl, slug, page } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const state = useArea(api, slug, page);
  if (state.status === "error") {
    return <span className="area-meta">{t("areas.loadFailed")}</span>;
  }
  const data = state.status === "ready" ? state.data : page;
  if ("redirect" in data) return <Navigate to={`/app/areas/${data.redirect}`} replace />;
  return <AreaPageView key={slug} api={api} page={data} />;
}

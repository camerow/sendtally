import type { LinksFunction, LoaderFunctionArgs, MetaDescriptor } from "react-router";
import areasStyles from "../areas/areas.css?url";
import { cloudflareContext } from "../lib/cloudflare-context";
import { pageMeta } from "../lib/seo";
import projectsStyles from "../projects/projects.css?url";
import sessionsStyles from "../sessions/sessions.css?url";
import trainingStyles from "../training/training.css?url";
import moderationStyles from "./moderation.css?url";

/** An admin page's meta: never indexed. */
export const adminMeta = (title: string, path: string): MetaDescriptor[] =>
  pageMeta({ title, path, noindex: true });

export const adminLinks: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: projectsStyles },
  { rel: "stylesheet", href: areasStyles },
  { rel: "stylesheet", href: trainingStyles },
  { rel: "stylesheet", href: moderationStyles },
];

export async function adminLoader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

/** Where an old /app/moderation link lands now. */
export function moderationRedirect(url: URL): string {
  const tab = url.searchParams.get("tab");
  if (tab === "library") {
    const item = url.searchParams.get("item");
    return item === null
      ? "/app/admin/library"
      : `/app/admin/library?${new URLSearchParams({ item }).toString()}`;
  }
  return tab === null
    ? "/app/admin"
    : `/app/admin/areas?${new URLSearchParams({ tab }).toString()}`;
}

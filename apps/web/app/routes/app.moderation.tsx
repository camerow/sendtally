import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import areasStyles from "../areas/areas.css?url";
import { cloudflareContext } from "../lib/cloudflare-context";
import { ModerationPage } from "../moderation/components/ModerationPage";
import moderationStyles from "../moderation/moderation.css?url";
import projectsStyles from "../projects/projects.css?url";
import sessionsStyles from "../sessions/sessions.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: projectsStyles },
  { rel: "stylesheet", href: areasStyles },
  { rel: "stylesheet", href: moderationStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export default function ModerationRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  return <ModerationPage apiUrl={apiUrl} />;
}

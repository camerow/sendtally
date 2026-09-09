import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { cloudflareContext } from "../lib/cloudflare-context";
import { ProjectsList } from "../projects/components/ProjectsList";
import projectsStyles from "../projects/projects.css?url";
import sessionsStyles from "../sessions/sessions.css?url";

type LoaderData = { apiUrl: string };

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: projectsStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export default function ProjectsRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  return <ProjectsList apiUrl={apiUrl} />;
}

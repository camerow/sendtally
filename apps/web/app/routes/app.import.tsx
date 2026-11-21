import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import { useHydrated } from "../lib/useHydrated";
import { ImportFlow } from "../import/components/ImportFlow";
import trainingStyles from "../training/training.css?url";

// The import steps, drawn as a training description.
export const links: LinksFunction = () => [{ rel: "stylesheet", href: trainingStyles }];

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export default function ImportRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const hydrated = useHydrated();
  if (!hydrated) return <div />;
  return <ImportFlow api={api} />;
}

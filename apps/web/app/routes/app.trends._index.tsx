import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { cloudflareContext } from "../lib/cloudflare-context";
import { getMembership } from "../lib/billing.server";
import { TrendsOverview } from "../trends/components/TrendsOverview";
import trendsStyles from "../trends/trends.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: trendsStyles }];

type LoaderData = { apiUrl: string; canSeeInsights: boolean };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return {
    apiUrl: args.context.get(cloudflareContext).env.API_URL,
    canSeeInsights: (await getMembership(args)).active,
  };
}

export default function TrendsRoute(): React.ReactElement {
  const { apiUrl, canSeeInsights } = useLoaderData<typeof loader>();

  return <TrendsOverview apiUrl={apiUrl} preview={!canSeeInsights} />;
}

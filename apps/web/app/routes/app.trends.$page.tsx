import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { TREND_PAGES, type TrendPage } from "@sendtally/features/trends";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireMembership } from "../lib/billing.server";
import { DaysTrends } from "../trends/components/DaysTrends";
import { EnduranceTrends } from "../trends/components/EnduranceTrends";
import trendsStyles from "../trends/trends.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: trendsStyles }];

type LoaderData = { apiUrl: string; page: TrendPage };

/** Only endurance and days have pages of their own; an old metric link lands on the overview. */
export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const page = TREND_PAGES.find((p) => p === args.params.page);
  if (page === undefined) throw redirect("/app/trends");
  await requireMembership(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL, page };
}

export default function TrendPageRoute(): React.ReactElement {
  const { apiUrl, page } = useLoaderData<typeof loader>();
  return page === "days" ? <DaysTrends apiUrl={apiUrl} /> : <EnduranceTrends apiUrl={apiUrl} />;
}

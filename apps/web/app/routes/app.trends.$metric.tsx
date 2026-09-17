import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams } from "react-router";
import { TREND_METRICS, type TrendMetric } from "@sendtally/features/trends";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireMembership } from "../lib/billing.server";
import { TrendDetail } from "../trends/components/TrendDetail";

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireMembership(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export default function TrendDetailRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const params = useParams();
  const metric = TREND_METRICS.includes(params.metric as TrendMetric)
    ? (params.metric as TrendMetric)
    : "volume";

  return <TrendDetail apiUrl={apiUrl} metric={metric} />;
}

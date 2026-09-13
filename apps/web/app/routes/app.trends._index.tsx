import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { MEMBER_POINTS } from "@sendtally/features/billing";
import { UpgradePanel } from "../billing/components/UpgradePanel";
import { cloudflareContext } from "../lib/cloudflare-context";
import { getMembership } from "../lib/billing.server";
import { TrendsOverview } from "../trends/components/TrendsOverview";

type LoaderData = { apiUrl: string; canSeeInsights: boolean };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return {
    apiUrl: args.context.get(cloudflareContext).env.API_URL,
    canSeeInsights: (await getMembership(args)).active,
  };
}

export default function TrendsRoute(): React.ReactElement {
  const { apiUrl, canSeeInsights } = useLoaderData<typeof loader>();

  if (!canSeeInsights) {
    return (
      <UpgradePanel
        eyebrow="MEMBERS"
        title="Your sessions are adding up to something. Trends is where you see it."
        body="Keep logging for free - your logbook is yours either way. Membership unlocks the screens that read the whole history back to you."
        points={MEMBER_POINTS}
      />
    );
  }

  return <TrendsOverview apiUrl={apiUrl} />;
}

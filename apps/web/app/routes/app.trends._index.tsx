import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { memberPoints } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
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
        eyebrow={t("common.members")}
        title={t("trends.upgradeTitle")}
        body={t("trends.upgradeBody")}
        points={memberPoints()}
      />
    );
  }

  return <TrendsOverview apiUrl={apiUrl} />;
}

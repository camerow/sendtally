import { useUser } from "@clerk/react-router";
import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import type { Membership } from "@sendtally/api-client";
import { membershipVM } from "@sendtally/features/billing";
import { useGradeScales, useSettings, useStravaPosting } from "@sendtally/features/settings";
import { cloudflareContext } from "../lib/cloudflare-context";
import { getMembership } from "../lib/billing.server";
import { useClientApi } from "../lib/useClientApi";
import { SettingsView } from "../settings/components/SettingsView";

type LoaderData = { apiUrl: string; membership: Membership };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  return {
    apiUrl: args.context.get(cloudflareContext).env.API_URL,
    membership: await getMembership(args),
  };
}

export default function SettingsRoute(): React.ReactElement {
  const { apiUrl, membership } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const { user } = useUser();
  const { vm, reload } = useSettings(api);
  const posting = useStravaPosting(api, vm, reload);
  const scales = useGradeScales(api, vm, reload);

  return (
    <SettingsView
      vm={vm}
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
      membership={membershipVM({ membership })}
      posting={posting}
      scales={scales}
    />
  );
}

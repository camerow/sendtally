import { useUser } from "@clerk/react-router";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import type { MembershipStatus } from "@sendtally/api-client";
import { membershipVM } from "@sendtally/features/billing";
import { useGyms } from "@sendtally/features/gyms";
import { queries, useQuery } from "@sendtally/features/query";
import { useGradeScales, useSettings, useStravaPosting } from "@sendtally/features/settings";
import menuRowStyles from "../components/menu-row.css?url";
import { cloudflareContext } from "../lib/cloudflare-context";
import { getMembership } from "../lib/billing.server";
import { useClientApi } from "../lib/useClientApi";
import { useIsModerator } from "../lib/useIsModerator";
import { SettingsView } from "../settings/components/SettingsView";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: menuRowStyles }];

type LoaderData = { apiUrl: string; membership: MembershipStatus };

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
  const gyms = useGyms(api);
  const moderator = useIsModerator();
  const { state: status } = useQuery(queries.status(api));

  return (
    <SettingsView
      vm={vm}
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
      membership={membershipVM({ membership })}
      posting={posting}
      scales={scales}
      gyms={gyms.gyms}
      gymsReady={gyms.ready}
      onboarding={status.status === "ready" ? status.data.onboarding.progress : null}
      moderator={moderator}
    />
  );
}

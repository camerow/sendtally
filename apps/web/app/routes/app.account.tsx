import { useClerk, useUser } from "@clerk/react-router";
import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { useDeleteAccount } from "@sendtally/features/settings";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import { AccountView } from "../settings/components/AccountView";

type LoaderData = { apiUrl: string };

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export default function AccountRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const clerk = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const signOut = React.useCallback(
    () => void clerk.signOut(() => navigate("/")),
    [clerk, navigate]
  );
  const deletion = useDeleteAccount(api, signOut);

  return (
    <AccountView
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
      deletion={deletion}
      onSignOut={signOut}
    />
  );
}

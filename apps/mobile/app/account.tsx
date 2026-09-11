import { useClerk, useUser } from "@clerk/clerk-expo";
import * as Application from "expo-application";
import { router } from "expo-router";
import React from "react";
import { useDeleteAccount } from "@sendtally/features/settings";
import { AccountView } from "../features/settings/AccountView";
import { useApi } from "../lib/api";

function versionLabel(): string {
  const version = Application.nativeApplicationVersion ?? "";
  const build = Application.nativeBuildVersion ?? "";
  if (version === "") return "SENDTALLY";
  return build === "" ? `SENDTALLY ${version}` : `SENDTALLY ${version} (${build})`;
}

export default function Account(): React.ReactElement {
  const api = useApi();
  const clerk = useClerk();
  const { user } = useUser();
  const signOut = React.useCallback(() => {
    void clerk.signOut().then(() => router.replace("/sign-in"));
  }, [clerk]);
  const deletion = useDeleteAccount(api, signOut);

  return (
    <AccountView
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
      version={versionLabel()}
      deletion={deletion}
      onBack={router.back}
      onSignOut={signOut}
    />
  );
}

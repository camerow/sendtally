import { useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React from "react";
import { useDeleteAccount, useSettings, useStravaPosting } from "@sendtally/features/settings";
import { SettingsView } from "../../features/settings/SettingsView";
import { useApi } from "../../lib/api";

export default function Settings(): React.ReactElement {
  const api = useApi();
  const clerk = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const { vm, reload } = useSettings(api);
  const onDeleted = React.useCallback(() => {
    void clerk.signOut().then(() => router.replace("/sign-in"));
  }, [clerk, router]);
  const deletion = useDeleteAccount(api, onDeleted);
  const posting = useStravaPosting(api, vm, reload);

  return (
    <SettingsView
      vm={vm}
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
      deletion={deletion}
      posting={posting}
      onSignOut={() => {
        void clerk.signOut().then(() => router.replace("/sign-in"));
      }}
    />
  );
}

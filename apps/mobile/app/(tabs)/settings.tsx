import { useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React from "react";
import {
  useDeleteAccount,
  useGradeScales,
  useSettings,
  useStravaPosting,
} from "@sendtally/features/settings";
import { useBilling } from "../../features/billing/useBilling";
import { SettingsView } from "../../features/settings/SettingsView";
import { useApi } from "../../lib/api";

export default function Settings(): React.ReactElement {
  const api = useApi();
  const clerk = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const billing = useBilling();
  const { vm, reload } = useSettings(api);
  const onDeleted = React.useCallback(() => {
    void clerk.signOut().then(() => router.replace("/sign-in"));
  }, [clerk, router]);
  const deletion = useDeleteAccount(api, onDeleted);
  const posting = useStravaPosting(api, vm, reload);
  const scales = useGradeScales(api, vm, reload);
  const onSignOut = React.useCallback(() => {
    void clerk.signOut().then(() => router.replace("/sign-in"));
  }, [clerk, router]);
  const onOpenMembership = React.useCallback(() => router.push("/membership"), [router]);

  return (
    <SettingsView
      vm={vm}
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
      deletion={deletion}
      billing={
        billing === null ? null : { membership: billing.membership.vm, onOpen: onOpenMembership }
      }
      posting={posting}
      scales={scales}
      onSignOut={onSignOut}
    />
  );
}

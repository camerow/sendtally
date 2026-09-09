import { useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React from "react";
import { useDeleteAccount, useSettings } from "@sendtally/features/settings";
import type { MembershipFeature } from "@sendtally/features/billing";
import { useBilling } from "../../features/billing/useBilling";
import { usePurchase } from "../../features/billing/usePurchase";
import { SettingsView, type SettingsViewProps } from "../../features/settings/SettingsView";
import { useApi } from "../../lib/api";

function SettingsWithBilling({
  membership,
  ...rest
}: Omit<SettingsViewProps, "billing"> & { membership: MembershipFeature }): React.ReactElement {
  const purchase = usePurchase(membership.refresh);
  return <SettingsView {...rest} billing={{ membership: membership.vm, purchase }} />;
}

export default function Settings(): React.ReactElement {
  const api = useApi();
  const clerk = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const billing = useBilling();
  const { vm } = useSettings(api);
  const onDeleted = React.useCallback(() => {
    void clerk.signOut().then(() => router.replace("/sign-in"));
  }, [clerk, router]);
  const deletion = useDeleteAccount(api, onDeleted);
  const onSignOut = React.useCallback(() => {
    void clerk.signOut().then(() => router.replace("/sign-in"));
  }, [clerk, router]);
  const shared = {
    vm,
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    deletion,
    onSignOut,
  };

  if (billing === null) return <SettingsView {...shared} billing={null} />;
  return <SettingsWithBilling {...shared} membership={billing.membership} />;
}

import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React from "react";
import { useSettings, useStravaPosting } from "@sendtally/features/settings";
import type { Discipline, GradeScale } from "@sendtally/features/log-session";
import { useBilling } from "../../features/billing/useBilling";
import { SettingsView } from "../../features/settings/SettingsView";
import { useApi } from "../../lib/api";
import { setGradePref, useGradePrefs } from "../../lib/gradePrefs";

export default function Settings(): React.ReactElement {
  const api = useApi();
  const { user } = useUser();
  const router = useRouter();
  const billing = useBilling();
  const { vm, reload } = useSettings(api);
  const posting = useStravaPosting(api, vm, reload);
  const gradePrefs = useGradePrefs();
  const onChangeGradePref = React.useCallback((discipline: Discipline, scale: GradeScale) => {
    void setGradePref(discipline, scale);
  }, []);
  const onOpenMembership = React.useCallback(() => router.push("/membership"), [router]);
  const onOpenAccount = React.useCallback(() => router.push("/account"), [router]);

  return (
    <SettingsView
      vm={vm}
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
      gradePrefs={gradePrefs}
      billing={
        billing === null ? null : { membership: billing.membership.vm, onOpen: onOpenMembership }
      }
      posting={posting}
      onChangeGradePref={onChangeGradePref}
      onOpenAccount={onOpenAccount}
    />
  );
}

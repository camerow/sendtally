import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React from "react";
import { useGyms } from "@sendtally/features/gyms";
import { useGradeScales, useSettings, useStravaPosting } from "@sendtally/features/settings";
import type { Discipline, GradeScale } from "@sendtally/features/log-session";
import { useBilling } from "../../features/billing/useBilling";
import { useCsvExport } from "../../features/settings/useCsvExport";
import { SettingsView } from "../../features/settings/SettingsView";
import { useStravaConnect } from "../../features/settings/useStravaConnect";
import { useApi } from "../../lib/api";

export default function Settings(): React.ReactElement {
  const api = useApi();
  const { user } = useUser();
  const router = useRouter();
  const billing = useBilling();
  const { vm, reload } = useSettings(api);
  const posting = useStravaPosting(api, vm, reload);
  const connect = useStravaConnect(api, reload);
  const scales = useGradeScales(api, vm, reload);
  const gyms = useGyms(api);
  const exporter = useCsvExport(api);
  const onChangeGradePref = React.useCallback(
    (discipline: Discipline, scale: GradeScale) => scales.set({ [discipline]: scale }),
    [scales]
  );
  const onOpenMembership = React.useCallback(() => router.push("/membership"), [router]);
  const onOpenAccount = React.useCallback(() => router.push("/account"), [router]);

  return (
    <SettingsView
      vm={vm}
      email={user?.primaryEmailAddress?.emailAddress ?? ""}
      gradePrefs={scales.scales}
      gyms={gyms.gyms}
      billing={
        billing === null ? null : { membership: billing.membership.vm, onOpen: onOpenMembership }
      }
      posting={posting}
      connect={connect}
      exporter={exporter}
      onChangeGradePref={onChangeGradePref}
      onOpenAccount={onOpenAccount}
    />
  );
}

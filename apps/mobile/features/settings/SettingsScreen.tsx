import { useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { useGradeScales, useSettings, useStravaPosting } from "@sendtally/features/settings";
import type { Discipline, GradeScale } from "@sendtally/features/log-session";
import { useBilling } from "../billing/useBilling";
import { importResultText } from "./importResultText";
import { useCsvExport } from "./useCsvExport";
import { SettingsView } from "./SettingsView";
import { useStravaConnect } from "./useStravaConnect";
import { useApi } from "../../lib/api";
import { Toast } from "../../components/Toast";

export function SettingsScreen(): React.ReactElement {
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
  const onImport = React.useCallback(() => router.push("/import"), [router]);
  const { imported, skipped } = useLocalSearchParams<{ imported?: string; skipped?: string }>();
  const result =
    imported === undefined ? null : { imported: Number(imported), skipped: Number(skipped ?? 0) };

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
      onImport={onImport}
      toast={
        result !== null && (
          <Toast
            message={importResultText(result)}
            {...(result.imported > 0 && {
              action: {
                label: t("common.view"),
                onPress: () =>
                  router.push({ pathname: "/(tabs)/sessions", params: { segment: "climbing" } }),
              },
            })}
            onHide={() => router.setParams({ imported: undefined, skipped: undefined })}
          />
        )
      }
    />
  );
}

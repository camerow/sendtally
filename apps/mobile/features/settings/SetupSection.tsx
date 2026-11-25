import { router } from "expo-router";
import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { OnboardingPath } from "@sendtally/features/settings";
import { queries, useQuery } from "@sendtally/features/query";
import { useApi } from "../../lib/api";
import { sectionCard, sectionLabel } from "../../lib/styles";
import { MenuRow } from "../live-session/MenuRow";
import { openMembershipPage, useLocks } from "../training/locks";

const row: ViewStyle = { backgroundColor: colors.white, borderRadius: radius.card };

const open = (path: OnboardingPath): void => router.push(`/first-run?path=${path}&from=account`);

/** Either onboarding path, any time: a finished history path reopens on adding climbs. */
export function SetupSection(): React.ReactElement {
  const { state } = useQuery(queries.status(useApi()));
  const progress = state.status === "ready" ? state.data.onboarding.progress : null;
  const planLocked = useLocks().create;
  return (
    <View style={sectionCard}>
      <Text style={sectionLabel}>{t("onboarding.setup.section")}</Text>
      <View style={{ gap: 4 }}>
        <View style={row}>
          <MenuRow
            icon="climbs"
            title={t("onboarding.chooser.historyTitle")}
            hint={
              progress === null
                ? undefined
                : progress.sessions
                  ? t("onboarding.setup.historyDoneHint")
                  : t("onboarding.setup.historyHint")
            }
            onPress={() => open("history")}
          />
        </View>
        <View style={row}>
          <MenuRow
            icon="train"
            title={t("onboarding.chooser.planTitle")}
            hint={
              progress === null
                ? undefined
                : progress.scheduledBlocks
                  ? t("common.done")
                  : t("onboarding.setup.notStarted")
            }
            onPress={() => (planLocked ? openMembershipPage("create") : open("plan"))}
            locked={planLocked}
          />
        </View>
      </View>
    </View>
  );
}

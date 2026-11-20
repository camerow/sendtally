import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { formatDate, formatNumber, t } from "@sendtally/features/i18n";
import { queries } from "@sendtally/features/query";
import { useBilling } from "../../billing/useBilling";
import { MenuRow } from "../../live-session/MenuRow";
import { startLiveSession } from "../../live-session/startLiveSession";
import { Button } from "../../training/components/Button";
import { Title } from "../../training/components/Title";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { HistoryCard } from "./components/HistoryCard";
import { useHistoryCard } from "./useHistoryCard";

/** H6: the log is ready; on to the plan path, a live session today, or the Log. */
export function DoneStep({ wizard, api }: Parameters<StepComponent>[0]): React.ReactElement {
  const vm = useHistoryCard(api);
  const status = useQuery(queries.status(api)).data;
  const membership = useBilling()?.membership;
  const member = membership?.active === true;
  const outcome = member ? "member" : "later";
  const endsAt =
    membership?.state.status === "ready" ? membership.state.data.trial.endsAt : undefined;
  const planDone = status?.onboarding.progress.scheduledBlocks === true;
  const rows = [
    ...(planDone
      ? []
      : [
          {
            icon: "train" as const,
            title: t("onboarding.chooser.planTitle"),
            hint: t("onboarding.history.done.planHint"),
            onPress: () => {
              wizard.complete(outcome, "other_path");
              wizard.choose("plan", "end_screen");
            },
          },
        ]),
    {
      icon: "climb" as const,
      title: t("onboarding.history.done.logToday"),
      hint: t("onboarding.history.done.logTodayHint"),
      onPress: () => {
        wizard.complete(outcome, "live_session");
        startLiveSession(undefined, undefined, router.replace);
      },
    },
    {
      icon: "sessions" as const,
      title: t("onboarding.history.done.openLog"),
      hint:
        wizard.memory.way === "import"
          ? t("sessions.sessionCount", { count: vm?.sessions ?? 0 })
          : `${formatNumber(vm?.climbs ?? 0)} ${t("onboarding.history.reveal.climbsWord", { count: vm?.climbs ?? 0 })}`,
      onPress: () => wizard.complete(outcome, "log"),
    },
  ];
  return (
    <WizardFrame wizard={wizard} bar={false}>
      <Title size={34}>{t("onboarding.history.done.title")}</Title>
      {vm !== null && (
        <HistoryCard vm={vm} label={t("onboarding.history.card.soFar")} slim max={4} />
      )}
      <View
        style={{
          gap: 4,
          padding: 4,
          borderRadius: radius.panel,
          backgroundColor: colors.surfaceSoft,
        }}
      >
        {rows.map((r) => (
          <View
            key={r.title}
            style={{ borderRadius: radius.cardLg, backgroundColor: colors.white }}
          >
            <MenuRow icon={r.icon} title={r.title} hint={r.hint} onPress={r.onPress} />
          </View>
        ))}
      </View>
      {!member && endsAt !== undefined && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: radius.card,
            backgroundColor: colors.gold,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: colors.gunmetal,
              }}
            >
              {t("billing.freeTrialEnds", {
                date: formatDate(new Date(endsAt), { month: "short", day: "numeric" }),
              })}
            </Text>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
              {t("onboarding.membership.keepWhatYouBuilt")}
            </Text>
          </View>
          <Button
            variant="primary"
            height={40}
            label={t("billing.becomeAMember")}
            onPress={() => router.push("/membership")}
          />
        </View>
      )}
    </WizardFrame>
  );
}

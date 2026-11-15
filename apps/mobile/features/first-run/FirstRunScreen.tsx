import { randomUUID } from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { readImportResult } from "@sendtally/features/import";
import {
  FIRST_RUN_SOURCES,
  firstRunNextLabel,
  firstRunSourceLabel,
  useFirstRunFlow,
} from "@sendtally/features/settings";
import { OptionRow } from "../../components/OptionRow";
import { ScreenFrame } from "../../components/ScreenFrame";
import { useApi } from "../../lib/api";
import { Button } from "../training/components/Button";
import { Label } from "../training/components/Label";
import { Title } from "../training/components/Title";
import { useToday } from "../training/data/useToday";
import { WeekdayChips } from "../training/planning/WeekdayChips";
import { usePlanActions } from "../training/plan/usePlanActions";
import { useReminderPrompt } from "../training/reminders/ReminderPromptProvider";

/** Once per account: the log they keep already, then the days they climb, ending on Plan. */
export function FirstRunScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ imported?: string; skipped?: string; likely?: string }>();
  const result = readImportResult((k) => params[k as keyof typeof params]);
  const flow = useFirstRunFlow(useApi(), {
    imported: result !== null,
    today: useToday(),
    newId: randomUUID,
    actions: usePlanActions(),
    onPlanned: useReminderPrompt(),
    go: (to) => {
      if (to === "import") router.push({ pathname: "/import", params: { then: "/first-run" } });
      else if (to === "log") router.replace("/(tabs)/sessions");
      else router.replace({ pathname: "/(tabs)/today", params: result === null ? {} : params });
    },
  });

  const header = (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingTop: 6,
      }}
    >
      <Label color={colors.textMuted}>
        {t("onboarding.firstRun.step", { n: flow.step, total: 2 })}
      </Label>
      <Button variant="link" label={t("onboarding.firstRun.skip")} onPress={flow.skip} />
    </View>
  );

  if (flow.step === 2) {
    return (
      <ScreenFrame
        header={header}
        footer={
          <Button
            variant="azure"
            label={t("onboarding.firstRun.continue")}
            onPress={flow.saveDays}
          />
        }
      >
        <Title size={34}>{t("onboarding.firstRun.daysQuestion")}</Title>
        <WeekdayChips days={flow.days} onToggle={flow.toggleDay} />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      header={header}
      footer={
        <View style={{ gap: 6 }}>
          <Button
            variant="azure"
            label={firstRunNextLabel(flow.source)}
            onPress={flow.next}
            disabled={flow.source === null}
          />
          <Button variant="link" label={t("onboarding.firstRun.later")} onPress={flow.later} />
        </View>
      }
    >
      <Title size={34}>{t("onboarding.firstRun.logQuestion")}</Title>
      <View style={{ gap: 2 }}>
        {FIRST_RUN_SOURCES.map((s) => (
          <OptionRow
            key={s}
            label={firstRunSourceLabel(s)}
            {...(s === "spreadsheet" && { detail: "CSV" })}
            mono={false}
            selected={flow.source === s}
            onPress={() => flow.pick(s)}
          />
        ))}
      </View>
    </ScreenFrame>
  );
}

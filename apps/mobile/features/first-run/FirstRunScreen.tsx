import { randomUUID } from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { FirstRunAnswers } from "@sendtally/api-client";
import type { Weekday } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  FIRST_RUN_SOURCES,
  firstRunNextLabel,
  firstRunSourceLabel,
  useFirstRun,
  type FirstRunSource,
} from "@sendtally/features/settings";
import { toggleIn } from "@sendtally/features/training";
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

type ImportParams = { imported?: string; skipped?: string; likely?: string };

/** Once per account: the log they keep already, then the days they climb, ending on Plan. */
export function FirstRunScreen(): React.ReactElement {
  const api = useApi();
  const { finish } = useFirstRun(api);
  const actions = usePlanActions();
  const prompt = useReminderPrompt();
  const today = useToday();
  const result = useLocalSearchParams<ImportParams>();
  const [source, setSource] = React.useState<FirstRunSource | null>(null);
  const [onDays, setOnDays] = React.useState(false);
  const [days, setDays] = React.useState<readonly Weekday[]>([]);
  const step = onDays || result.imported !== undefined ? 2 : 1;
  const existingLog = source ?? "skipped";

  const end = (endedAt: FirstRunAnswers["endedAt"], climbingDays: number): void => {
    void finish({ existingLog, climbingDays, endedAt }).catch(() => undefined);
    if (endedAt !== "plan") return router.replace("/(tabs)/sessions");
    const { imported, skipped, likely } = result;
    router.replace({
      pathname: "/(tabs)/today",
      params: imported === undefined ? {} : { imported, skipped, likely },
    });
  };

  const saveDays = (): void => {
    if (days.length > 0) {
      void actions.saveMembership({
        id: randomUUID(),
        workoutId: "climb-session",
        blockId: null,
        weekdays: [...days],
        start: today,
        position: 0,
      });
      prompt();
    }
    end("plan", days.length);
  };

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
      <Label color={colors.textMuted}>{t("onboarding.firstRun.step", { n: step, total: 2 })}</Label>
      <Button
        variant="link"
        label={t("onboarding.firstRun.skip")}
        onPress={() => end(step === 1 ? "skip_log" : "skip_days", 0)}
      />
    </View>
  );

  if (step === 2) {
    return (
      <ScreenFrame
        header={header}
        footer={
          <Button variant="azure" label={t("onboarding.firstRun.continue")} onPress={saveDays} />
        }
      >
        <Title size={34}>{t("onboarding.firstRun.daysQuestion")}</Title>
        <WeekdayChips days={days} onToggle={(d) => setDays(toggleIn(days, d))} />
      </ScreenFrame>
    );
  }

  const next = (): void => {
    if (source === null || source === "none") return setOnDays(true);
    router.push({ pathname: "/import", params: { then: "/first-run" } });
  };

  return (
    <ScreenFrame
      header={header}
      footer={
        <View style={{ gap: 6 }}>
          <Button
            variant="azure"
            label={firstRunNextLabel(source)}
            onPress={next}
            disabled={source === null}
          />
          <Button
            variant="link"
            label={t("onboarding.firstRun.later")}
            onPress={() => setOnDays(true)}
          />
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
            selected={source === s}
            onPress={() => setSource(s)}
          />
        ))}
      </View>
    </ScreenFrame>
  );
}

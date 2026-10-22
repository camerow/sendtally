import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  clock,
  isWork,
  runSeconds,
  stepsDone,
  type IntervalPhase,
  type Run,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { doneOfRun, kindLabel, useActivityActions } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { EffortField } from "../components/EffortField";
import { Label } from "../components/Label";
import { StatGrid } from "../components/StatGrid";
import { Title } from "../components/Title";
import type { IntervalsRun } from "./intervalsParams";
import { startTimeOf } from "./intervalsText";

export type IntervalsDoneProps = { workout: IntervalsRun; run: Run<IntervalPhase> };

const reportFailure = (): void => Alert.alert(t("activities.saveFailed"));

/** The finished run: how long and how much of it, an effort, and saving it as an activity. */
export function IntervalsDone({ workout, run }: IntervalsDoneProps): React.ReactElement {
  const actions = useActivityActions(useApi(), reportFailure);
  const [rpe, setRpe] = React.useState<number | null>(null);
  const seconds = runSeconds(run, run.finished?.at ?? run.phaseStartedAt);
  const done = stepsDone(run);
  const total = run.phases.filter((p) => isWork(p.kind)).length;
  const title = workout.title.trim() === "" ? kindLabel(workout.kind) : workout.title;

  const save = (): void => {
    void actions.saveActivity({
      id: workout.activityId ?? randomUUID(),
      kind: workout.kind,
      title,
      date: workout.date,
      startTime: startTimeOf(run.startedAt),
      minutes: Math.max(1, Math.round(seconds / 60)),
      rpe,
      notes: null,
      workoutId: workout.workoutId,
      ...workout.link,
      done: doneOfRun(workout.body, done),
    });
    router.dismissAll();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: 20,
          paddingTop: 30,
          paddingHorizontal: 18,
          paddingBottom: 16,
        }}
      >
        <View style={{ gap: 6 }}>
          <Label color={colors.labelAccent}>
            {`${kindLabel(workout.kind)} · ${
              run.finished?.ended === false ? t("hang.sessionComplete") : t("hang.endedEarly")
            }`}
          </Label>
          <Title size={40}>{title}</Title>
        </View>
        <StatGrid
          columns={2}
          valueSize={22}
          stats={[
            { label: t("hang.statDuration"), value: clock(seconds, true) },
            { label: t("activities.statSteps"), value: `${done.length}/${total}` },
          ]}
        />
        <EffortField value={rpe} onChange={setRpe} />
        <View style={{ flex: 1 }} />
        <View style={{ gap: 6 }}>
          <Button label={t("activities.saveRun")} onPress={save} variant="primary" height={54} />
          <Button label={t("hang.discard")} onPress={() => router.back()} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

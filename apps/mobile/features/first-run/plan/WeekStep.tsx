import { randomUUID } from "expo-crypto";
import React from "react";
import { Text, View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  resumedPath,
  sessionsPerWeek,
  setPlanPath,
  usePlanPath,
  type Wizard,
} from "@sendtally/features/settings";
import { newBlock, usePlan } from "@sendtally/features/training";
import { useWorkouts } from "@sendtally/features/workouts";
import { Button } from "../../training/components/Button";
import { Title } from "../../training/components/Title";
import { useHangData } from "../../training/data/HangDataContext";
import { CategoryMark } from "../../training/library/CategoryMark";
import { useLibrary } from "../../training/library/useLibrary";
import { usePlanActions } from "../../training/plan/usePlanActions";
import { WeekdayChips } from "../../training/planning/WeekdayChips";
import { type } from "../../training/type";
import { WizardFrame } from "../WizardFrame";
import { AddWorkoutSheet } from "./AddWorkoutSheet";
import { WeekCard } from "./components/WeekCard";
import { YoursTag } from "./components/YoursTag";

const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** P3: which days each workout runs, saved as a draft block on Continue. */
export function WeekStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const mine = useWorkouts(api).state;
  const { state } = useLibrary();
  const { today } = useHangData();
  const actions = usePlanActions();
  const [adding, setAdding] = React.useState(false);

  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (seeded.current || plan.status !== "ready" || mine.status !== "ready") return;
    seeded.current = true;
    setPlanPath((p) => resumedPath(p, plan.data, mine.data));
  }, [plan, mine]);

  const workout = (id: string) => (state.status === "ready" ? state.data.workout(id) : undefined);
  const daysOf = (id: string): readonly Weekday[] => path.days[id] ?? [];
  const sessions = sessionsPerWeek(path.days);
  const week = WEEKDAYS.map((d) => {
    const kinds = path.workouts
      .filter((id) => daysOf(id).includes(d))
      .map((id) => workout(id)?.kind)
      .filter((k): k is WorkoutKind => k !== undefined);
    return kinds.length === 0 ? null : kinds;
  });
  const free = wizard.memory.days;
  const dim = free.length === 0 ? [] : WEEKDAYS.filter((d) => !free.includes(d));

  const toggle = (id: string, day: Weekday): void =>
    setPlanPath((p) => {
      const now = p.days[id] ?? [];
      const next = now.includes(day) ? now.filter((d) => d !== day) : [...now, day];
      return { ...p, days: { ...p.days, [id]: next } };
    });

  const save = (): void => {
    const blockId = path.blockId ?? randomUUID();
    const saved = plan.status === "ready" && plan.data.blocks.some((b) => b.id === blockId);
    if (!saved) void actions.saveBlock({ ...newBlock(blockId), start: null });
    const scheduled = path.workouts.filter((id) => daysOf(id).length > 0);
    const members = Object.fromEntries(
      scheduled.map((workoutId, position) => {
        const id = path.members[workoutId] ?? randomUUID();
        void actions.saveMembership({
          id,
          workoutId,
          blockId,
          weekdays: [...daysOf(workoutId)].sort((a, b) => a - b),
          start: today,
          position,
        });
        return [workoutId, id];
      })
    );
    Object.entries(path.members)
      .filter(([workoutId]) => !(workoutId in members))
      .forEach(([, id]) => void actions.deleteMembership(id));
    setPlanPath((p) => ({ ...p, blockId, members }));
    wizard.next();
  };

  return (
    <WizardFrame
      wizard={wizard}
      sticky={[1]}
      footer={
        <Button
          variant="primary"
          height={54}
          label={t("onboarding.firstRun.continue")}
          disabled={sessions === 0}
          onPress={save}
        />
      }
    >
      <Title size={34}>{t("onboarding.plan.week.title")}</Title>
      <WeekCard
        week={week}
        meta={t("onboarding.plan.week.perWeek", { count: sessions })}
        empty={t("onboarding.plan.week.empty")}
      />
      <View style={{ gap: 14 }}>
        {path.workouts.map((id) => {
          const w = workout(id);
          return (
            <View key={id} style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {w !== undefined && <CategoryMark kind={w.kind} />}
                <Text
                  numberOfLines={1}
                  style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}
                >
                  {w?.name ?? ""}
                </Text>
                {w?.source === "mine" && <YoursTag />}
              </View>
              <WeekdayChips days={daysOf(id)} dim={dim} onToggle={(d) => toggle(id, d)} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row" }}>
        <Button
          variant="outline"
          icon="plus"
          height={48}
          label={t("onboarding.plan.week.addWorkout")}
          onPress={() => setAdding(true)}
        />
        <AddWorkoutSheet
          visible={adding}
          onClose={() => setAdding(false)}
          onBuildAnother={() => {
            setPlanPath((p) => ({ ...p, building: null }));
            wizard.back();
          }}
        />
      </View>
    </WizardFrame>
  );
}

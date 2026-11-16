import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  newSchedule,
  nextPosition,
  scheduledMemberships,
  scheduleReady,
  toggled,
  usePlan,
  type ScheduleDraft,
  type ScheduleMode,
  scheduleAddLabel,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { exerciseEntry, pickWith, useExerciseWorkout } from "@sendtally/features/exercises";
import { useExercises } from "@sendtally/features/statistics";
import { useWorkoutActions } from "@sendtally/features/workouts";
import { useMakeExercise } from "../exercises/useMakeExercise";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { MonthCalendar } from "../components/MonthCalendar";
import { Segmented } from "../components/Segmented";
import { SheetSection } from "../components/SheetSection";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { useLibrary } from "../library/useLibrary";
import { usePlanActions } from "../plan/usePlanActions";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { StartField } from "./StartField";
import { WeekdayChips } from "./WeekdayChips";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

/** A workout, or an exercise whose one-exercise workout is made on Add. */
export type ScheduleScreenProps = { workoutId?: string; exerciseId?: string };

/**
 * Scheduling a workout outside any block: every week on some days, or on some dates. Back on
 * Today at the day it starts.
 */
export function ScheduleScreen({
  workoutId,
  exerciseId,
}: ScheduleScreenProps): React.ReactElement | null {
  const { today } = useHangData();
  const api = useApi();
  const library = useLibrary();
  const exercises = useExercises(api).state;
  const save = useWorkoutActions(api, failed).saveWorkout;
  const pick = pickWith(useMakeExercise());
  const plan = usePlan(api).state;
  const actions = usePlanActions();
  const prompt = useReminderPrompt();
  const ensure = useExerciseWorkout({
    workouts: library.state.status === "ready" ? library.state.data.workouts : [],
    pick,
    save,
    newId: randomUUID,
  });
  const [draft, setDraft] = React.useState(() => newSchedule(null, today));
  const update = (patch: Partial<ScheduleDraft>): void => setDraft((d) => ({ ...d, ...patch }));

  if (library.state.status !== "ready")
    return <LoadState state={library.state} onRetry={() => void library.reload()} />;
  const workout = workoutId === undefined ? undefined : library.state.data.workout(workoutId);
  const entry =
    exerciseId === undefined || exercises.status !== "ready"
      ? undefined
      : exerciseEntry(exercises.data, exerciseId);
  const name = workout?.name ?? entry?.name;
  if (name === undefined) return null;
  const days = scheduledMemberships(draft, "", () => "", 0).map((m) => m.start);
  const resolve = async (): Promise<string | null> =>
    workout?.id ?? (entry === undefined ? null : ensure(entry));

  const add = async (): Promise<void> => {
    const id = await resolve();
    if (id === null) return;
    const position = plan.status === "ready" ? nextPosition(plan.data, null) : 0;
    const memberships = scheduledMemberships(draft, id, randomUUID, position);
    memberships.forEach((m) => void actions.saveMembership(m));
    const [first] = memberships;
    if (first === undefined) return;
    prompt();
    router.dismissTo({
      pathname: "/(tabs)/today",
      params: { date: first.start, at: String(Date.now()) },
    });
  };

  return (
    <ScreenFrame
      footer={
        <Button
          label={scheduleAddLabel(draft, days.length, days[0])}
          onPress={() => void add()}
          disabled={!scheduleReady(draft)}
          variant="primary"
          height={54}
        />
      }
    >
      <View style={{ gap: 4 }}>
        <Label color={colors.gunmetal}>{name}</Label>
        <Title size={34}>{t("plan.howOften")}</Title>
      </View>
      <Segmented<ScheduleMode>
        value={draft.mode}
        onChange={(mode) => update({ mode })}
        options={[
          { value: "repeat", label: t("plan.repeatEvery") },
          { value: "dates", label: t("plan.specificDays") },
        ]}
      />
      {draft.mode === "repeat" ? (
        <SheetSection label={t("plan.days")}>
          <WeekdayChips
            days={draft.weekdays}
            onToggle={(day) => update({ weekdays: toggled(draft.weekdays, day) })}
          />
        </SheetSection>
      ) : (
        <MonthCalendar
          selected={draft.dates[0] ?? today}
          picked={draft.dates}
          min={today}
          today={today}
          shaded={() => false}
          onPick={(d) => update({ dates: toggled(draft.dates, d) })}
        />
      )}
      {draft.mode === "repeat" && (
        <StartField value={draft.start} min={today} onChange={(start) => update({ start })} />
      )}
    </ScreenFrame>
  );
}

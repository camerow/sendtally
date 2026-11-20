import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { eachSideOf, tallyMeasuresOf } from "@sendtally/features/exercises";
import { useGrips, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { Wizard } from "@sendtally/features/settings";
import { queries, useQuery } from "@sendtally/features/query";
import { useExercises } from "@sendtally/features/statistics";
import { usePlan } from "@sendtally/features/training";
import { estimatedMinutes, unplannedItems, workoutMinutes } from "@sendtally/features/workouts";
import { useBilling } from "../../billing/useBilling";
import { MenuRow, type MenuRowProps } from "../../live-session/MenuRow";
import { Title } from "../../training/components/Title";
import { useHangData } from "../../training/data/HangDataContext";
import { startLibraryWorkout } from "../../training/library-detail/startLibraryWorkout";
import { useLibrary, useNextSession } from "../../training/library/useLibrary";
import { WizardFrame } from "../WizardFrame";
import { WeekCard } from "./components/WeekCard";
import { firstWeekday, sessionsPerWeek } from "./planMaths";
import { usePlanPath } from "./planPath";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

/** P7: hands over to the first workout, the Plan tab, or the other path. */
export function DoneStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const library = useLibrary().state;
  const status = useQuery(queries.status(api)).state;
  const { today } = useHangData();
  const exercises = useExercises(api).state;
  const { isGrip } = useGrips(api);
  const outcome = useBilling()?.membership.active === true ? "member" : "later";

  const ready = plan.status === "ready" && library.status === "ready";
  const members = ready
    ? plan.data.memberships
        .filter((m) => m.blockId !== null && m.blockId === path.blockId)
        .sort((a, b) => a.position - b.position)
    : [];
  const placed = members.flatMap((m) => {
    const workout = ready ? library.data.workout(m.workoutId) : undefined;
    return workout === undefined ? [] : [{ m, workout }];
  });
  const days = Object.fromEntries(members.map((m) => [m.id, m.weekdays]));
  const perWeek = sessionsPerWeek(days);
  const first = firstWeekday(days);
  const workout = placed[0]?.workout;
  const session = useNextSession(workout?.id ?? "");
  const noSessions = status.status === "ready" && !status.data.onboarding.progress.sessions;

  const week = DAYS.map((d) => {
    const kinds = placed.filter(({ m }) => m.weekdays.includes(d)).map(({ workout: w }) => w.kind);
    return kinds.length > 0 ? kinds : null;
  });

  const rows: (MenuRowProps & { key: string })[] = [];
  if (workout !== undefined) {
    const minutes = workoutMinutes(workout) ?? estimatedMinutes(workout);
    rows.push({
      key: "start",
      icon: "train",
      title: t("onboarding.plan.done.startNow", { name: workout.name }),
      ...(minutes === null ? {} : { hint: t("onboarding.plan.done.startHint", { minutes }) }),
      onPress: () => {
        wizard.complete(outcome, "first_workout");
        const mine = exercises.status === "ready" ? exercises.data : [];
        startLibraryWorkout(
          workout,
          today,
          unplannedItems(workout, session),
          eachSideOf(mine),
          tallyMeasuresOf(mine, workout.kind, isGrip),
          isGrip,
          router.replace
        );
      },
    });
  }
  if (noSessions)
    rows.push({
      key: "history",
      icon: "climbs",
      title: t("onboarding.chooser.historyTitle"),
      hint: t("onboarding.plan.done.historyHint"),
      onPress: () => {
        wizard.complete(outcome, "other_path");
        wizard.choose("history", "end_screen");
      },
    });
  rows.push({
    key: "plan",
    icon: "today",
    title: t("onboarding.plan.done.openPlan"),
    ...(first === null
      ? {}
      : { hint: t("onboarding.plan.done.dayFirst", { day: weekdayLong(first) }) }),
    onPress: () => wizard.complete(outcome, "plan"),
  });

  return (
    <WizardFrame wizard={wizard} bar={false}>
      <Title size={34}>{t("onboarding.plan.done.title")}</Title>
      <WeekCard
        week={week}
        meta={t("onboarding.plan.week.perWeek", { count: perWeek })}
        empty={t("onboarding.plan.week.empty")}
      />
      <View style={{ gap: 4, padding: 4, borderRadius: 20, backgroundColor: colors.surfaceSoft }}>
        {rows.map(({ key, ...row }) => (
          <View key={key} style={{ borderRadius: 16, backgroundColor: colors.white }}>
            <MenuRow {...row} />
          </View>
        ))}
      </View>
    </WizardFrame>
  );
}

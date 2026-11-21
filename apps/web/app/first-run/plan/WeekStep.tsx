import React from "react";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { Button } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import {
  resumedPath,
  sessionsPerWeek,
  setPlanPath,
  usePlanPath,
} from "@sendtally/features/settings";
import { newBlock, usePlan } from "@sendtally/features/training";
import { useWorkouts } from "@sendtally/features/workouts";
import { CategoryMark } from "../../training/components/CategoryMark";
import { useHangData } from "../../training/data/HangDataContext";
import { usePlanActions } from "../../training/data/usePlanActions";
import { useLibrary } from "../../training/library/useLibrary";
import { WeekdayChips } from "../../training/schedule/WeekdayChips";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { AddWorkoutSheet } from "./components/AddWorkoutSheet";
import { WeekCard } from "./components/WeekCard";
import { YoursTag } from "./components/YoursTag";

const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const newId = (): string => crypto.randomUUID();

/** P3: which days each workout runs, saved as a draft block on Continue. */
export const WeekStep: StepComponent = ({ wizard, api }) => {
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
    const blockId = path.blockId ?? newId();
    const saved = plan.status === "ready" && plan.data.blocks.some((b) => b.id === blockId);
    if (!saved) void actions.saveBlock({ ...newBlock(blockId), start: null });
    const scheduled = path.workouts.filter((id) => daysOf(id).length > 0);
    const members = Object.fromEntries(
      scheduled.map((workoutId, position) => {
        const id = path.members[workoutId] ?? newId();
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
      footer={
        <Button variant="azure" disabled={sessions === 0} onClick={() => sessions > 0 && save()}>
          {t("onboarding.firstRun.continue")}
        </Button>
      }
    >
      <h1 className="wizard-title">{t("onboarding.plan.week.title")}</h1>
      <div className="plan-path-sticky">
        <WeekCard
          steady
          week={week}
          meta={t("onboarding.plan.week.perWeek", { count: sessions })}
          empty={t("onboarding.plan.week.empty")}
        />
      </div>
      <div className="plan-path-workouts">
        {path.workouts.map((id) => {
          const w = workout(id);
          return (
            <div key={id} className="plan-path-workout">
              <div className="plan-path-workout-head">
                {w !== undefined && <CategoryMark kind={w.kind} size={28} />}
                <span className="plan-path-workout-name">{w?.name ?? ""}</span>
                {w?.source === "mine" && <YoursTag />}
              </div>
              <WeekdayChips days={daysOf(id)} dim={dim} onToggle={(d) => toggle(id, d)} />
            </div>
          );
        })}
      </div>
      <div>
        <Button variant="ghostOnLight" onClick={() => setAdding(true)}>
          + {t("onboarding.plan.week.addWorkout")}
        </Button>
      </div>
      <AddWorkoutSheet
        open={adding}
        onClose={() => setAdding(false)}
        onBuildAnother={() => {
          setPlanPath((p) => ({ ...p, building: null }));
          wizard.back();
        }}
      />
    </WizardFrame>
  );
};

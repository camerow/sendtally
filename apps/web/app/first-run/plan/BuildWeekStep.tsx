import React from "react";
import { Button } from "@sendtally/design";
import { useExerciseList } from "@sendtally/features/exercises";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { libraryPictures } from "@sendtally/features/library";
import { useBuildWeek } from "@sendtally/features/settings";
import { libraryLine } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { useHangData } from "../../training/data/HangDataContext";
import { usePlanActions } from "../../training/data/usePlanActions";
import { useLibrary } from "../../training/library/useLibrary";
import { AddWorkoutRow } from "../../training/plan-week/AddWorkoutRow";
import { WeekdayChips } from "../../training/schedule/WeekdayChips";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { AddWorkoutSheet } from "./components/AddWorkoutSheet";
import { WeekCard } from "./components/WeekCard";
import { YoursTag } from "./components/YoursTag";

const newId = (): string => crypto.randomUUID();

/** Build your week: workouts picked from the library and put on their days, the week card pinned above. */
export const BuildWeekStep: StepComponent = ({ wizard, api }) => {
  const { model, today } = useHangData();
  const exercises = useExerciseList(api);
  const step = useBuildWeek({
    wizard,
    api,
    today,
    library: useLibrary().state,
    actions: usePlanActions(),
    newId,
  });
  const [all, setAll] = React.useState(false);
  const build = (): void => wizard.open("P2");
  const title = <h1 className="wizard-title">{t("onboarding.plan.build.title")}</h1>;
  const footer = (
    <Button
      variant="azure"
      disabled={step.status !== "ready" || step.sessions === 0}
      onClick={() => step.status === "ready" && step.schedule()}
    >
      {t("plan.scheduleFrom", { day: shortDate(step.start) })}
    </Button>
  );
  if (step.status !== "ready")
    return (
      <WizardFrame wizard={wizard} footer={footer}>
        {title}
      </WizardFrame>
    );

  return (
    <WizardFrame wizard={wizard} footer={footer}>
      {title}
      <div className="plan-path-sticky">
        <WeekCard
          week={step.week}
          meta={t("onboarding.plan.week.perWeek", { count: step.sessions })}
          empty={t("onboarding.plan.build.tapDays")}
        />
      </div>
      <div className="build-week-rows">
        <span className="train-label">{t("workouts.fromLibrary")}</span>
        {step.rows.map(({ workout: w, picked, days }) => (
          <div key={w.id} className={picked ? "build-week-row is-picked" : "build-week-row"}>
            <AddWorkoutRow
              kind={w.kind}
              name={w.name}
              meta={libraryLine(w, model.settings.units, exercises)}
              picture={libraryPictures("workout", w.id)[0]}
              state={picked ? "added" : "none"}
              thereLabel=""
              tag={w.source === "mine" ? <YoursTag /> : undefined}
              onOpen={() => step.toggle(w.id)}
              onAdd={() => step.toggle(w.id)}
              onUndo={() => step.toggle(w.id)}
            />
            {picked && <WeekdayChips days={days} onToggle={(d) => step.toggleDay(w.id, d)} />}
          </div>
        ))}
      </div>
      <div className="build-week-actions">
        <Button variant="ghostOnLight" onClick={build}>
          <Icon name="plus" size={18} strokeWidth={2.4} />
          {t("onboarding.plan.build.own")}
        </Button>
        <button type="button" className="text-button" onClick={() => setAll(true)}>
          {t("onboarding.plan.build.all")}
        </button>
      </div>
      <AddWorkoutSheet open={all} onClose={() => setAll(false)} onBuildAnother={build} />
    </WizardFrame>
  );
};

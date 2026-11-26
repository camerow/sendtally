import React from "react";
import { letterOf } from "@sendtally/core/hang";
import { Button } from "@sendtally/design";
import { weightText } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useBlockStep, weeklyStepKg } from "@sendtally/features/settings";
import { loadColumns } from "@sendtally/features/training";
import { Segmented } from "../../components/Segmented";
import { LoadTable } from "../../training/blocks/LoadTable";
import { Stepper } from "../../training/components/Stepper";
import { useHangData } from "../../training/data/HangDataContext";
import { usePlanActions } from "../../training/data/usePlanActions";
import { useLibrary } from "../../training/library/useLibrary";
import { DarkCard } from "../components/DarkCard";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { LoadBars } from "./components/LoadBars";

/** P4, a side step from the reveal: the block's length and how the load changes week by week. */
export const BlockStep: StepComponent = ({ wizard, api }) => {
  const { model } = useHangData();
  const unit = model.settings.units;
  const step = useBlockStep({
    wizard,
    api,
    model,
    library: useLibrary().state,
    actions: usePlanActions(),
  });

  if (step.status === "loading")
    return (
      <WizardFrame
        wizard={wizard}
        skip={false}
        footer={
          <Button variant="azure" disabled>
            {t("common.save")}
          </Button>
        }
      >
        {null}
      </WizardFrame>
    );

  const {
    workout,
    exercise,
    weeks,
    resize,
    alt,
    dose,
    setShown,
    written,
    weighted,
    shortcuts,
    anyShortcut,
    toggle,
    shownChanges,
    setCell,
    bars,
    save,
  } = step;

  const chip = (label: string, on: boolean, onClick: () => void): React.ReactElement => (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      className="plan-path-chip"
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <WizardFrame
      wizard={wizard}
      skip={false}
      footer={
        <Button variant="azure" onClick={save}>
          {t("common.save")}
        </Button>
      }
    >
      <h1 className="wizard-title">{t("onboarding.plan.block.title")}</h1>
      <div className="plan-path-sticky">
        <DarkCard
          raised
          label={t("onboarding.plan.block.weekByWeek", { name: exercise })}
          meta={t("calendar.weeks", { count: weeks })}
          note={t("onboarding.plan.block.sameSoFar", { build: t("onboarding.plan.block.build") })}
          noteShown={!anyShortcut}
        >
          <LoadBars bars={bars} />
        </DarkCard>
      </div>
      <div className="plan-path-between">
        <span className="plan-path-strong">{t("plan.weeks")}</span>
        <Stepper
          onStep={resize}
          decreaseLabel={t("hang.decrease", { field: t("plan.weeks") })}
          increaseLabel={t("hang.increase", { field: t("plan.weeks") })}
        >
          <b className="plan-path-stepper-value">{t("calendar.weeks", { count: weeks })}</b>
        </Stepper>
      </div>
      <div className="plan-path-section">
        <div className="plan-path-between">
          <span className="train-label">{exercise}</span>
          <span className="plan-path-meta">{workout.name}</span>
        </div>
        {alt && (
          <Segmented
            label={exercise}
            options={[0, 1].map((d) => ({
              value: String(d),
              label: t("onboarding.plan.block.session", { letter: letterOf(d) }),
            }))}
            value={String(dose)}
            onChange={(v) => setShown(Number(v))}
          />
        )}
        <div className="plan-path-chips">
          {chip(
            weighted
              ? t("onboarding.plan.block.addLoad", { amount: weightText(weeklyStepKg(unit), unit) })
              : t("onboarding.plan.block.addRep"),
            shortcuts.stepUp,
            () => toggle("stepUp")
          )}
          {chip(t("onboarding.plan.block.deloadLast"), shortcuts.deload, () => toggle("deload"))}
        </div>
        <LoadTable
          key={dose}
          kind={workout.kind}
          written={written}
          changes={shownChanges}
          columns={loadColumns(workout.kind, written, shownChanges)}
          unit={unit}
          current={null}
          done={null}
          editing
          onChange={setCell}
        />
      </div>
    </WizardFrame>
  );
};

import React from "react";
import { Button } from "@sendtally/design";
import { shortDate, useGrips } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  sessionsPerWeek,
  shapeable,
  useOnePress,
  useSeededPlanPath,
  weekBars,
} from "@sendtally/features/settings";
import { KIND_LOOK, usePlan } from "@sendtally/features/training";
import { useTween } from "@sendtally/features/trends";
import { useHangData } from "../../training/data/HangDataContext";
import { useLibrary } from "../../training/library/useLibrary";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { LoadBars } from "./components/LoadBars";
import { PlanCalendar } from "./components/PlanCalendar";

/** P5: the whole block on a calendar, its session count running up, and Shape the weeks. */
export const RevealStep: StepComponent = ({ wizard, api }) => {
  const path = useSeededPlanPath(api);
  const plan = usePlan(api).state;
  const library = useLibrary().state;
  const unit = useHangData().model.settings.units;
  const { gripName } = useGrips(api);
  const ready = plan.status === "ready" && library.status === "ready";
  const block = ready ? plan.data.blocks.find((b) => b.id === path.blockId) : undefined;
  const members = ready
    ? plan.data.memberships
        .filter((m) => m.blockId === block?.id)
        .sort((a, b) => a.position - b.position)
    : [];
  const placed = members.flatMap((m) => {
    const workout = ready ? library.data.workout(m.workoutId) : undefined;
    return workout === undefined ? [] : [{ m, workout }];
  });
  const start = block?.start ?? null;
  const weeks = block?.weeks ?? 0;
  const days = Object.fromEntries(members.map((m) => [m.id, m.weekdays]));
  const total = sessionsPerWeek(days) * weeks;
  const shown = Math.round(useTween(block === undefined ? null : total, 900) ?? 0);

  const once = useOnePress(true);
  React.useEffect(() => {
    if (block === undefined) return;
    wizard.capture("onboarding_reveal_viewed", {
      path: "plan",
      weeks,
      sessions_planned: total,
      reminders: "off",
    });
  });

  const changed =
    ready && plan.data.weekChanges.some((c) => members.some((m) => m.id === c.membershipId));
  const shaped = shapeable(placed.map(({ workout }) => workout));
  const shapedIn = placed.find(({ workout }) => workout === shaped);
  const main =
    changed && shapedIn !== undefined
      ? weekBars(shapedIn.workout, shapedIn.m.id, weeks, plan.data.weekChanges, unit, gripName)
      : null;

  return (
    <WizardFrame
      center
      wizard={wizard}
      dark
      skip={false}
      footer={
        <Button variant="gold" onClick={once(() => wizard.next())}>
          {t("onboarding.firstRun.continue")}
        </Button>
      }
    >
      {block !== undefined && start !== null && (
        <>
          <div className="plan-path-reveal-head">
            <span className="dark-label">{t("onboarding.plan.yourPlan")}</span>
            <h1 className="wizard-title">{block.name}</h1>
            <div className="plan-path-count">
              <span className="plan-path-count-number">{shown}</span>
              <span className="plan-path-count-word">
                {t("onboarding.plan.reveal.sessionsWord", { count: total })}
              </span>
            </div>
            <span className="dark-meta">
              {t("onboarding.plan.reveal.weeksStart", { count: weeks, date: shortDate(start) })}
            </span>
          </div>
          <PlanCalendar
            start={start}
            weeks={weeks}
            days={placed.map(({ m, workout }) => ({ kind: workout.kind, weekdays: m.weekdays }))}
          />
          <div className="plan-path-legend">
            {placed
              .filter(({ m }) => m.weekdays.length > 0)
              .map(({ m, workout }) => (
                <span key={m.id} className="plan-path-legend-item">
                  <i style={{ background: KIND_LOOK[workout.kind].onDark }} />
                  {workout.name}
                </span>
              ))}
          </div>
          {main !== null && (
            <div className="plan-path-section">
              <span className="dark-label">
                {t("onboarding.plan.block.weekByWeek", { name: main.name })}
              </span>
              <LoadBars bars={main.bars} height={26} />
            </div>
          )}
          {shaped !== undefined && (
            <div>
              <Button variant="ghostOnDark" onClick={() => wizard.open("P4")}>
                {t("onboarding.plan.reveal.shapeWeeks")}
              </Button>
            </div>
          )}
        </>
      )}
    </WizardFrame>
  );
};

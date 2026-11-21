import React from "react";
import { isChecklist, itemIdOf, letterOf, type Dose, type WeekChange } from "@sendtally/core/hang";
import { Button } from "@sendtally/design";
import { hangLoadText, shortDate, weightText } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  nextMonday,
  resumedPath,
  setPlanPath,
  shortcutChanges,
  shortcutOf,
  usePlanPath,
  weeklyStepKg,
  type Shortcuts,
} from "@sendtally/features/settings";
import { clampWeeks, emptyPlanDraft, loadColumns, usePlan } from "@sendtally/features/training";
import { exerciseName, useWorkouts } from "@sendtally/features/workouts";
import { Segmented } from "../../components/Segmented";
import { LoadTable } from "../../training/blocks/LoadTable";
import { NameField } from "../../training/components/NameField";
import { Stepper } from "../../training/components/Stepper";
import { useHangData } from "../../training/data/HangDataContext";
import { usePlanActions } from "../../training/data/usePlanActions";
import { useLibrary } from "../../training/library/useLibrary";
import { DarkCard } from "../components/DarkCard";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { LoadBars } from "./components/LoadBars";

const MIN_WEEKS = 2;

type Changes = Record<number, Partial<Dose>[]>;

const sized = (changes: readonly Partial<Dose>[] | undefined, weeks: number): Partial<Dose>[] =>
  Array.from({ length: weeks }, (_, i) => changes?.[i] ?? {});

const changed = (c: Partial<Dose> | undefined): boolean =>
  c !== undefined && Object.keys(c).length > 0;

/** P4: the week becomes a block, with its name, its length and how the load changes. */
export const BlockStep: StepComponent = ({ wizard, api }) => {
  const { model, today } = useHangData();
  const unit = model.settings.units;
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const mine = useWorkouts(api).state;
  const library = useLibrary().state;
  const actions = usePlanActions();
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (seeded.current || path.blockId !== null) return;
    if (plan.status !== "ready" || mine.status !== "ready") return;
    seeded.current = true;
    setPlanPath((p) => resumedPath(p, plan.data, mine.data));
  }, [path.blockId, plan, mine]);

  const [typed, setTyped] = React.useState<string | null>(null);
  const [stepped, setStepped] = React.useState<number | null>(null);
  const [shortcuts, setShortcuts] = React.useState<Shortcuts>({ stepUp: false, deload: false });
  const [shown, setShown] = React.useState(0);
  const [changes, setChanges] = React.useState<Changes>({});

  const block =
    plan.status === "ready" ? plan.data.blocks.find((b) => b.id === path.blockId) : undefined;
  const first = path.workouts[0];
  const workout =
    library.status === "ready" && first !== undefined ? library.data.workout(first) : undefined;
  const item =
    workout?.items.find((i) => (i.doses[0]?.weightKg ?? 0) > 0) ??
    workout?.items.find((i) => !isChecklist(i));
  const start = nextMonday(today);
  const scheduleLabel = t("plan.scheduleFrom", { day: shortDate(start) });

  if (block === undefined || workout === undefined || item === undefined || plan.status !== "ready")
    return (
      <WizardFrame
        wizard={wizard}
        footer={
          <Button variant="azure" disabled>
            {scheduleLabel}
          </Button>
        }
      >
        {null}
      </WizardFrame>
    );

  const weeks = stepped ?? clampWeeks(block.weeks, MIN_WEEKS);
  const name = typed ?? block.name;
  const alt = item.doses.length > 1;
  const dose = alt ? shown : 0;
  const written = item.doses[dose] ?? item.doses[0] ?? { sets: 1 };
  const weighted = (item.doses[0]?.weightKg ?? 0) > 0;
  const itemId = itemIdOf(item, workout.items.indexOf(item));
  const shownChanges = sized(changes[dose], weeks);
  const anyShortcut = shortcuts.stepUp || shortcuts.deload;

  const filled = (next: Shortcuts, length: number): Changes =>
    Object.fromEntries(item.doses.map((d, i) => [i, shortcutChanges(d, length, next, unit)]));

  const toggle = (key: keyof Shortcuts): void => {
    const next = { ...shortcuts, [key]: !shortcuts[key] };
    setShortcuts(next);
    setChanges(filled(next, weeks));
  };

  const resize = (by: 1 | -1): void => {
    const next = clampWeeks(weeks + by, MIN_WEEKS);
    setStepped(next);
    setChanges((c) =>
      anyShortcut
        ? filled(shortcuts, next)
        : Object.fromEntries(item.doses.map((_, i) => [i, sized(c[i], next)]))
    );
  };

  const setCell = (week: number, change: Partial<Dose>): void =>
    setChanges((c) => ({
      ...c,
      [dose]: sized(c[dose], weeks).map((x, i) => (i === week - 1 ? change : x)),
    }));

  const loadText = (d: Dose): string =>
    (d.weightKg ?? 0) > 0
      ? workout.kind === "hangboard"
        ? hangLoadText(d.weightKg ?? 0, unit)
        : weightText(d.weightKg ?? 0, unit)
      : t("statistics.repsValue", { count: d.reps ?? 0 });

  const bars = shownChanges.map((c, i) => {
    const d = { ...written, ...c };
    return {
      label: loadText(d),
      value: d.sets * (d.reps ?? 1) * ((d.weightKg ?? 0) > 0 ? (d.weightKg ?? 0) : 10),
      deload: shortcuts.deload && weeks > 1 && i === weeks - 1,
    };
  });

  const memberships = plan.data.memberships;
  const ready = library.status === "ready" ? library.data : null;
  const exercise = exerciseName(item.exercise, model.gripName);
  const doses = item.doses.map((_, d) => sized(changes[d], weeks));
  const count = Array.from({ length: weeks }, (_, w) => w).filter((w) =>
    doses.some((c) => changed(c[w]))
  ).length;

  const schedule = (): void => {
    const members = path.workouts
      .filter(
        (w) =>
          w === first ||
          (item.id !== undefined && ready?.workout(w)?.items.some((i) => i.id === item.id) === true)
      )
      .flatMap((w) => {
        const id = path.members[w];
        return id === undefined ? [] : [id];
      });
    const weekChanges: WeekChange[] = members.flatMap((membershipId) =>
      doses.flatMap((list, d) =>
        list.flatMap((change, i) =>
          changed(change) ? [{ membershipId, week: i + 1, dose: d, itemId, change }] : []
        )
      )
    );
    void actions.saveDraft({
      ...emptyPlanDraft,
      block: { ...block, name: name.trim(), weeks, start },
      weekChanges,
    });
    memberships
      .filter((m) => m.blockId === block.id && m.start !== start)
      .forEach((m) => void actions.saveMembership({ ...m, start }));
    wizard.next({ count, shortcut: shortcutOf(shortcuts) });
  };

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
      footer={
        <Button
          variant="azure"
          disabled={name.trim() === ""}
          onClick={() => name.trim() !== "" && schedule()}
        >
          {scheduleLabel}
        </Button>
      }
    >
      <div className="plan-path-head">
        <h1 className="wizard-title">{t("onboarding.plan.block.title")}</h1>
        <p className="plan-path-body">{t("onboarding.plan.block.body")}</p>
      </div>
      <div className="plan-path-sticky">
        <DarkCard
          raised
          label={t("onboarding.plan.block.weekByWeek", { name: exercise })}
          meta={t("calendar.weeks", { count: weeks })}
          note={
            anyShortcut
              ? undefined
              : t("onboarding.plan.block.sameSoFar", { build: t("onboarding.plan.block.build") })
          }
        >
          <LoadBars bars={bars} />
        </DarkCard>
      </div>
      <NameField
        label={t("hang.name")}
        value={name}
        maxLength={80}
        placeholder={t("onboarding.plan.block.namePlaceholder")}
        onChange={setTyped}
      />
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

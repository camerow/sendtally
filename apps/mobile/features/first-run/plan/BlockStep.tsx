import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { isChecklist, itemIdOf, letterOf, type Dose, type WeekChange } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { hangLoadText, shortDate, weightText } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { Wizard } from "@sendtally/features/settings";
import { clampWeeks, emptyPlanDraft, loadColumns, usePlan } from "@sendtally/features/training";
import { exerciseName, useWorkouts } from "@sendtally/features/workouts";
import { press } from "../../../lib/press";
import { Button } from "../../training/components/Button";
import { Label } from "../../training/components/Label";
import { NameField } from "../../training/components/NameField";
import { Segmented } from "../../training/components/Segmented";
import { Stepper } from "../../training/components/Stepper";
import { Title } from "../../training/components/Title";
import { useHangData } from "../../training/data/HangDataContext";
import { useLibrary } from "../../training/library/useLibrary";
import { LoadTable } from "../../training/planning/LoadTable";
import { usePlanActions } from "../../training/plan/usePlanActions";
import { type } from "../../training/type";
import { DarkCard } from "../components/DarkCard";
import { WizardFrame } from "../WizardFrame";
import { LoadBars } from "./components/LoadBars";
import { nextMonday, shortcutChanges, shortcutOf, weeklyStepKg, type Shortcuts } from "./planMaths";
import { resumedPath, setPlanPath, usePlanPath } from "./planPath";

const MIN_WEEKS = 2;

type Changes = Record<number, Partial<Dose>[]>;

const sized = (changes: readonly Partial<Dose>[] | undefined, weeks: number): Partial<Dose>[] =>
  Array.from({ length: weeks }, (_, i) => changes?.[i] ?? {});

const changed = (c: Partial<Dose> | undefined): boolean =>
  c !== undefined && Object.keys(c).length > 0;

/** P4: the week becomes a block, with its name, its length and how the load changes. */
export function BlockStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
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

  if (block === undefined || workout === undefined || item === undefined || plan.status !== "ready")
    return (
      <WizardFrame
        wizard={wizard}
        footer={
          <Button
            variant="primary"
            height={54}
            label={t("plan.scheduleFrom", { day: shortDate(start) })}
            onPress={() => undefined}
            disabled
          />
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

  const chip = (label: string, on: boolean, onPress: () => void): React.ReactElement => (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      style={press({
        height: 44,
        paddingHorizontal: 14,
        borderRadius: 22,
        justifyContent: "center",
        backgroundColor: on ? colors.gunmetal : colors.surfaceSoft,
      })}
    >
      <Text style={[type.bodyBold, { fontSize: 13.5, color: on ? colors.white : colors.gunmetal }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <WizardFrame
      wizard={wizard}
      sticky={[1]}
      footer={
        <Button
          variant="primary"
          height={54}
          label={t("plan.scheduleFrom", { day: shortDate(start) })}
          onPress={schedule}
          disabled={name.trim() === ""}
        />
      }
    >
      <View style={{ gap: 8 }}>
        <Title size={34}>{t("onboarding.plan.block.title")}</Title>
        <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.textSecondary }]}>
          {t("onboarding.plan.block.body")}
        </Text>
      </View>
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
      <NameField
        value={name}
        onChange={setTyped}
        placeholder={t("onboarding.plan.block.namePlaceholder")}
        maxLength={80}
      />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {t("plan.weeks")}
        </Text>
        <Stepper
          surface="plain"
          text={t("calendar.weeks", { count: weeks })}
          label={t("plan.weeks")}
          decreaseLabel={t("hang.decrease", { field: t("plan.weeks") })}
          increaseLabel={t("hang.increase", { field: t("plan.weeks") })}
          onStep={resize}
        />
      </View>
      <View style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Label color={colors.gunmetal}>{exercise}</Label>
          <Text
            numberOfLines={1}
            style={[type.mono, { flexShrink: 1, fontSize: 12, color: colors.textSecondary }]}
          >
            {workout.name}
          </Text>
        </View>
        {alt && (
          <Segmented
            options={[0, 1].map((d) => ({
              value: String(d),
              label: t("onboarding.plan.block.session", { letter: letterOf(d) }),
            }))}
            value={String(dose)}
            onChange={(v) => setShown(Number(v))}
          />
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {chip(
            weighted
              ? t("onboarding.plan.block.addLoad", { amount: weightText(weeklyStepKg(unit), unit) })
              : t("onboarding.plan.block.addRep"),
            shortcuts.stepUp,
            () => toggle("stepUp")
          )}
          {chip(t("onboarding.plan.block.deloadLast"), shortcuts.deload, () => toggle("deload"))}
        </View>
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
      </View>
    </WizardFrame>
  );
}

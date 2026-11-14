import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { letterOf, type Dose } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import {
  loadColumns,
  useTrainingLog,
  KIND_LOOK,
  ladderView,
  loadSummary,
  toggleIn,
} from "@sendtally/features/training";
import { exerciseName } from "@sendtally/features/workouts";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { confirmDiscard, useDiscardGuard } from "../../../lib/useDiscardGuard";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { EditorHeader } from "../components/EditorHeader";
import { Label } from "../components/Label";
import { Segmented } from "../components/Segmented";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { useRunWorkout } from "../library/useLibrary";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";
import { LoadTable } from "./LoadTable";
import { LoadSection } from "./LoadSection";
import { usePlanDraft } from "./usePlanDraft";
import { WeekDaysGrid } from "./WeekDaysGrid";

export type LadderScreenProps = {
  id: string;
  /** Where back goes, as that screen is called; plain Back without it. */
  back?: string;
};

/**
 * A workout in its block: its days by week, and its weekly load as a table of the block's
 * weeks, each changing only what differs from the workout as written. Edit changes both,
 * saved together.
 */
export function LadderScreen({ id, back }: LadderScreenProps): React.ReactElement | null {
  const { model, today } = useHangData();
  const unit = model.settings.units;
  const { log } = useTrainingLog(useApi());
  const actions = usePlanActions();
  const draft = usePlanDraft(log.plan);
  useDiscardGuard(draft.dirty);
  const [turn, setTurn] = React.useState(0);
  const [open, setOpen] = React.useState<readonly number[]>([0]);
  const { plan } = draft;
  const view = ladderView(plan, log, model, id, turn, today);
  const library = useRunWorkout(view?.workout.id ?? null);
  if (view === null) return null;
  const { membership: m, block, workout: w, turns, items, current, ended, done, lines } = view;
  const look = KIND_LOOK[w.kind];
  const changesOf = (index: number): Partial<Dose>[] => view.changes[index] ?? [];
  const mine = library?.source === "mine";
  const editing = draft.editing && !ended;

  const loadOf = (index: number): React.ReactElement | null => {
    const item = items[index];
    if (item === undefined) return null;
    const changes = changesOf(index);
    return (
      <LoadTable
        key={`${turn}:${index}`}
        kind={w.kind}
        written={item.dose}
        changes={changes}
        columns={loadColumns(w.kind, item.dose, changes)}
        unit={unit}
        current={current}
        done={done}
        editing={editing}
        onChange={(week, change) =>
          draft.setChange({
            membershipId: id,
            week,
            ...view.at(index),
            change,
          })
        }
      />
    );
  };

  const remove = (): void =>
    confirmDestructive({
      title: t("plan.removeTitle", { title: w.name }),
      body: t("plan.removeBody"),
      action: t("plan.removeAction"),
      onConfirm: () => {
        void actions.deleteMembership(m.id);
        router.back();
      },
    });

  return (
    <ScreenFrame
      backLabel={back}
      {...(editing && {
        header: (
          <EditorHeader
            title={t("plan.editInBlock", { block: block.name })}
            onCancel={draft.dirty ? () => confirmDiscard(draft.cancel) : draft.cancel}
            onSave={draft.save}
            solid
          />
        ),
      })}
      action={
        <DetailActions
          {...(!ended && { onEdit: draft.begin })}
          menu={[
            {
              icon: "pencil",
              title: t("hang.editWorkout"),
              onPress: () =>
                router.push({
                  pathname: "/workout/edit",
                  params: mine ? { id: w.id } : { from: w.id },
                }),
            },
            {
              icon: "trash",
              title: t("plan.removeFromBlock"),
              danger: true,
              onPress: remove,
            },
          ]}
        />
      }
    >
      <View style={{ gap: 6 }}>
        <Label color={look.ink}>{`${block.name} · ${kindLabel(w.kind)}`}</Label>
        <Title size={32}>{w.name}</Title>
        {lines.map((line) => (
          <Text key={line} style={[type.mono, { fontSize: 12, lineHeight: 17, color: look.ink }]}>
            {line}
          </Text>
        ))}
      </View>
      <WeekDaysGrid
        block={block}
        membership={m}
        kind={w.kind}
        log={log}
        plan={plan}
        today={today}
        editing={editing}
        onToggle={(change) => draft.toggle(m.id, change)}
      />
      {turns > 1 && (
        <Segmented<string>
          value={String(turn)}
          onChange={(v) => setTurn(Number(v))}
          options={Array.from({ length: turns }, (_, i) => ({
            value: String(i),
            label: letterOf(i),
          }))}
        />
      )}
      <View style={{ gap: 10 }}>
        {items.length === 1 ? (
          <>
            <Label color={colors.gunmetal}>{t("plan.weeklyLoad")}</Label>
            {loadOf(0)}
          </>
        ) : (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Label color={colors.gunmetal}>{t("plan.weeklyLoad")}</Label>
              <Button
                label={t("plan.openAll")}
                onPress={() => setOpen(items.map((_, i) => i))}
                variant="link"
                height={36}
              />
            </View>
            {items.map((it, i) => (
              <LoadSection
                key={`${turn}:${i}`}
                name={exerciseName(it.exercise, model.gripName)}
                summary={loadSummary(w.kind, it.dose, unit, changesOf(i))}
                open={open.includes(i)}
                onToggle={() => setOpen(toggleIn(open, i))}
              >
                {loadOf(i)}
              </LoadSection>
            ))}
          </>
        )}
      </View>
    </ScreenFrame>
  );
}

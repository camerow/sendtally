import React from "react";
import { letterOf, type Dose } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import {
  KIND_LOOK,
  loadColumns,
  usePlan,
  usePlanDraft,
  useTrainingLog,
  ladderView,
  loadSummary,
  toggleIn,
} from "@sendtally/features/training";
import { exerciseName } from "@sendtally/features/workouts";
import { MoreMenu } from "../../components/MoreMenu";
import { Segmented } from "../../components/Segmented";
import { Sheet } from "../../components/Sheet";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useAppApi } from "../../lib/useAppApi";
import { useDiscardGuard } from "../../lib/useDiscardGuard";
import { useGoBack } from "../../lib/useGoBack";
import { useNavigate } from "react-router";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { usePlanActions } from "../data/usePlanActions";
import { copyWorkoutPath, editWorkoutPath } from "../editor/paths";
import { useLibrary, workoutIn } from "../library/useLibrary";
import { LoadSection } from "./LoadSection";
import { LoadTable } from "./LoadTable";
import { WeekDaysGrid } from "./WeekDaysGrid";

const BACK_TO = "/app/train";

/**
 * A workout in its block: its days by week, and its weekly load as a table of the block's
 * weeks, each changing only what differs from the workout as written. Edit changes both,
 * saved together.
 */
export function LadderPage({ id }: { id: string }): React.ReactElement {
  const { model, today } = useHangData();
  const unit = model.settings.units;
  const api = useAppApi();
  const loaded = usePlan(api);
  const { log } = useTrainingLog(api);
  const actions = usePlanActions();
  const navigate = useNavigate();
  const leave = useGoBack(BACK_TO);
  const draft = usePlanDraft(log.plan, actions);
  const guard = useDiscardGuard(draft.dirty);
  const workoutOf = workoutIn(useLibrary());
  const [turn, setTurn] = React.useState(0);
  const [open, setOpen] = React.useState<readonly number[]>([0]);
  const [removing, setRemoving] = React.useState(false);
  const { plan } = draft;
  const view = ladderView(plan, log, model, id, turn, today);

  if (loaded.state.status !== "ready")
    return (
      <DetailFrame backTo={BACK_TO}>
        <LoadState state={loaded.state} onRetry={() => void loaded.reload()} />
      </DetailFrame>
    );
  // Gone, removed elsewhere: Back still leaves.
  if (view === null) return <DetailFrame backTo={BACK_TO} />;

  const { membership: m, block, workout: w, turns, items, current, ended, done, lines } = view;
  const look = KIND_LOOK[w.kind];
  const changesOf = (index: number): Partial<Dose>[] => view.changes[index] ?? [];
  const mine = workoutOf(w.id)?.source === "mine";
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

  return (
    <DetailFrame
      wide
      backTo={BACK_TO}
      {...(editing && {
        backLabel: t("common.cancel"),
        onBack: () => guard.ask(draft.cancel),
        footer: (
          <button type="button" className="detail-primary" onClick={draft.save}>
            {t("common.save")}
          </button>
        ),
      })}
      action={
        !editing && (
          <span className="detail-actions">
            {!ended && (
              <button type="button" className="edit-button" onClick={draft.begin}>
                {t("common.edit")}
              </button>
            )}
            <MoreMenu
              label={t("summary.more")}
              items={[
                {
                  label: t("hang.editWorkout"),
                  onSelect: () =>
                    void navigate(mine ? editWorkoutPath(w.id) : copyWorkoutPath(w.id)),
                },
                {
                  label: t("plan.removeFromBlock"),
                  destructive: true,
                  onSelect: () => setRemoving(true),
                },
              ]}
            />
          </span>
        )
      }
    >
      <div className="block-head">
        <span className="train-label" style={{ color: editing ? undefined : look.ink }}>
          {editing
            ? t("plan.editInBlock", { block: block.name })
            : `${block.name} · ${kindLabel(w.kind)}`}
        </span>
        <h1 className="block-title">{w.name}</h1>
        {lines.map((line) => (
          <span key={line} className="ladder-line" style={{ color: look.ink }}>
            {line}
          </span>
        ))}
      </div>
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
          label={t("plan.weeklyLoad")}
          value={String(turn)}
          onChange={(v) => setTurn(Number(v))}
          options={Array.from({ length: turns }, (_, i) => ({
            value: String(i),
            label: letterOf(i),
          }))}
        />
      )}
      <section className="ladder-load">
        <div className="ladder-load-head">
          <h2 className="plan-label">{t("plan.weeklyLoad")}</h2>
          {items.length > 1 && (
            <button
              type="button"
              className="ladder-open-all"
              onClick={() => setOpen(items.map((_, i) => i))}
            >
              {t("plan.openAll")}
            </button>
          )}
        </div>
        {items.length === 1
          ? loadOf(0)
          : items.map((it, i) => (
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
      </section>
      <Sheet
        open={removing}
        title={t("plan.removeTitle", { title: w.name })}
        onClose={() => setRemoving(false)}
        action={{
          label: t("plan.removeAction"),
          danger: true,
          onPress: () => {
            setRemoving(false);
            leave();
            void actions.deleteMembership(m.id);
          },
        }}
      >
        <p className="sheet-body">{t("plan.removeBody")}</p>
      </Sheet>
      {guard.sheet}
    </DetailFrame>
  );
}

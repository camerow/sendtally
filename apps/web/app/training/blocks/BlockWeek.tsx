import React from "react";
import { useNavigate } from "react-router";
import type { Plan } from "@sendtally/api-client";
import { isDated, type Block, type Membership, type Weekday } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockWeekColumns,
  blockWeekDates,
  cellMark,
  daysInWeek,
  hasDays,
  planGridRows,
  scheduleOf,
  useTrainingLog,
  weekPlans,
  withFollowing,
  withoutFollowing,
  type CellMark,
  type DaySchedule,
  type DayToggle,
  type GridOptions,
  type Occurrence,
  type WorkoutLookup,
  useLit,
} from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { useAppApi } from "../../lib/useAppApi";
import { DashedPanel } from "../components/DashedPanel";
import { PlanGrid } from "../components/PlanGrid";
import { useHangData } from "../data/HangDataContext";
import { SwitchField } from "../../components/Switch";
import { useLibrary } from "../library/useLibrary";
import { AddWorkoutsSheet } from "../plan-week/AddWorkoutsSheet";
import { useDayChanges } from "../plan-week/useDayChanges";
import { BlockOrder } from "./BlockOrder";
import { DaySheet } from "./DaySheet";
import { membershipPath } from "./paths";
import { WeekNav } from "./WeekNav";

export type BlockWeekProps = {
  block: Block;
  members: readonly Membership[];
  workout: WorkoutLookup;
  /** Off once the block has ended: nothing added to it could still happen. */
  canAdd?: boolean;
  /**
   * The week its chips picked: on a template its numbers, on a scheduled block its dates and
   * how each day went. None reads the week as written.
   */
  week?: number;
  /** The plan with any draft applied, which the days read from. */
  plan?: Plan;
  /** Every day from today on a field, set through `onToggle`. */
  editing?: boolean;
  onToggle?: (membershipId: string, change: DayToggle) => void;
  /** Sets workouts' days at once, as Apply to following weeks does. */
  onSchedules?: (schedules: readonly DaySchedule[]) => void;
  /** Arrows to the week before and after, beside the title. */
  onPickWeek?: (week: number) => void;
  /** Turns on Edit mode, from the hint naming workouts with no days. */
  onEditDays?: () => void;
  /** Moves a workout a place in the block, from the Order list in Edit mode. */
  onMove?: (membershipId: string, by: -1 | 1) => void;
};

/**
 * A block's week, a row per workout opening it in the block, and + Add workout under it in Edit
 * mode. On a scheduled block a week shows its dates; in Edit mode a cell sets the workout's day.
 */
export function BlockWeek({
  block,
  members,
  workout,
  canAdd = true,
  week,
  plan: drafted,
  editing = false,
  onToggle,
  onSchedules,
  onPickWeek,
  onEditDays,
  onMove,
}: BlockWeekProps): React.ReactElement {
  const { model, today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const navigate = useNavigate();
  const plan = drafted ?? log.plan;
  const [adding, setAdding] = React.useState(false);
  const [open, setOpen] = React.useState<{
    occurrence: Occurrence;
    workout: LibraryWorkout;
  } | null>(null);
  const changes = useDayChanges();
  const libraryState = useLibrary().state;
  const library = (id: string): LibraryWorkout | undefined =>
    libraryState.status === "ready" ? libraryState.data.workout(id) : undefined;
  const template = !isDated(block);
  const shownWeek = week ?? 1;
  // The days before Apply to following weeks went on, which turning it off puts back.
  const [before, setBefore] = React.useState<readonly DaySchedule[] | null>(null);
  const [wasShowing, setWasShowing] = React.useState({ editing, shownWeek });
  if (editing !== wasShowing.editing || shownWeek !== wasShowing.shownWeek) {
    setWasShowing({ editing, shownWeek });
    setBefore(null);
  }
  const following = before !== null;
  const setFollowing = (on: boolean): void => {
    const now = members.map((m) => scheduleOf(plan, m));
    onSchedules?.(
      now.map((s, i) =>
        on
          ? withFollowing(s, shownWeek, block.weeks)
          : withoutFollowing(s, before?.[i] ?? s, shownWeek, block.weeks)
      )
    );
    setBefore(on ? now : null);
  };
  const dates = blockWeekDates(block, week);
  const statuses = dates === null ? null : weekPlans(log, dates, today);
  const marks =
    statuses === null
      ? undefined
      : (m: Membership): (CellMark | null)[] => statuses.map((plans) => cellMark(plans, m.id));
  const picksWeek = onPickWeek !== undefined && week !== undefined;
  const openRow = (m: Membership): void => void navigate(membershipPath(m));
  const options: GridOptions = editing
    ? {
        open: openRow,
        ...(marks !== undefined && { marks }),
        // A day gone by keeps how it went; today and later are set.
        toggle: (m: Membership, day: number) =>
          dates !== null && (dates[day] ?? today) < today
            ? undefined
            : () =>
                onToggle?.(m.id, {
                  week: shownWeek,
                  day: day as Weekday,
                  following,
                  last: block.weeks,
                }),
      }
    : {
        open: openRow,
        ...(template &&
          week !== undefined &&
          week > 1 && {
            week: { n: week, changes: plan.weekChanges, unit: model.settings.units },
          }),
        ...(marks !== undefined && {
          marks,
          // A planned day from today on opens its day; anything else opens the workout.
          press: (m: Membership, day: number) => {
            const o = statuses?.[day]?.find((x) => x.membership.id === m.id);
            const w = library(m.workoutId);
            return o === undefined || o.status !== "planned" || w === undefined
              ? undefined
              : () => setOpen({ occurrence: o, workout: w });
          },
        }),
      };
  const shown = members.map((m) => ({
    ...m,
    weekdays: daysInWeek(scheduleOf(plan, m), shownWeek),
  }));
  const rows = planGridRows(shown, workout, model, options);
  // Plans with no day in any week, such as ones just added: named, to click their days in.
  const dayless = members.filter((m) => !hasDays(scheduleOf(plan, m)));
  const daylessNames = dayless.map((m) => workout(m.workoutId)?.name ?? "").join(", ");
  const [added, setAdded] = useLit();
  const empty = template && rows.length === 0;
  const add = (
    <button
      type="button"
      className="detail-primary block-action"
      aria-label={t("plan.addToBlock", { name: block.name })}
      onClick={() => setAdding(true)}
    >
      <Icon name="plus" size={18} strokeWidth={2.4} />
      {t("plan.addWorkout")}
    </button>
  );
  const edit = onEditDays !== undefined && (
    <button type="button" className="detail-primary block-action" onClick={onEditDays}>
      {t("common.edit")}
    </button>
  );
  const action = editing ? add : edit;

  return (
    <div className="block-week">
      {empty ? (
        <div className="block-empty">
          <p className="block-empty-body">{t("plan.templateEmpty")}</p>
          {action}
        </div>
      ) : rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid
          rows={rows}
          lit={added}
          editing={editing}
          {...(picksWeek
            ? { head: <WeekNav week={week} weeks={block.weeks} onPick={onPickWeek} /> }
            : { title: t("plan.week") })}
          {...(dates !== null && { dates: dates.map((d) => String(Number(d.slice(8)))) })}
          {...(blockWeekColumns(block, week) !== undefined && {
            columns: blockWeekColumns(block, week),
          })}
          footer={
            editing &&
            shownWeek < block.weeks && (
              <div className="plan-grid-footer">
                <SwitchField
                  label={t("plan.applyFollowing")}
                  checked={following}
                  onChange={setFollowing}
                />
              </div>
            )
          }
        />
      )}
      {dayless.length > 0 && (editing || onEditDays === undefined) && (
        <p className="block-hint">{t("plan.tapDays", { workout: daylessNames })}</p>
      )}
      {canAdd && !empty && (editing || rows.length === 0) && action}
      {editing && onMove !== undefined && members.length > 1 && (
        <BlockOrder
          members={members}
          workout={workout}
          onMove={(id, by) => {
            onMove(id, by);
            setAdded([id]);
          }}
        />
      )}
      {open !== null && (
        <DaySheet
          occurrence={open.occurrence}
          workout={open.workout}
          rows={(logIt) => changes.items(open.occurrence, open.workout.name, logIt)}
          onClose={() => setOpen(null)}
        />
      )}
      {changes.sheets}
      {adding && (
        <AddWorkoutsSheet
          flow={{ date: null, blockId: block.id }}
          onClose={(ids) => {
            setAdding(false);
            setAdded(ids);
          }}
        />
      )}
    </div>
  );
}

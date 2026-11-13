import React from "react";
import { Text, View } from "react-native";
import type { Plan } from "@sendtally/api-client";
import { isDated, type Block, type Membership, type Weekday } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  daysInWeek,
  hasDays,
  scheduleOf,
  withFollowing,
  withoutFollowing,
  blockWeekColumns,
  blockWeekDates,
  cellMark,
  weekPlans,
  useTrainingLog,
  type DaySchedule,
  type DayToggle,
  type Occurrence,
  type WorkoutLookup,
  planGridRows,
  type CellMark,
  type GridOptions,
  useLit,
} from "@sendtally/features/training";
import { Switch } from "../../../components/Switch";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { AMBER } from "../components/tints";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { openMembership } from "../plan/openMembership";
import { DaySheet } from "../plan-days/DaySheet";
import { useDayChanges } from "../plan-days/useDayChanges";
import { useLibrary } from "../library/useLibrary";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { type } from "../type";
import { AddWorkoutsSheet } from "./AddWorkoutsSheet";
import { BlockOrder } from "./BlockOrder";
import { WeekNav } from "./WeekNav";

export type BlockWeekProps = {
  block: Block;
  members: readonly Membership[];
  workout: WorkoutLookup;
  /** A plan just added, lit for a moment. */
  lit?: string;
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
 * A block's week, a row per workout opening it in the block, and + Add workout under it in Edit mode. On a
 * scheduled block a week shows its dates; in Edit mode a cell sets the workout's day.
 */
export function BlockWeek({
  block,
  members,
  workout,
  lit,
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
  const { log } = useTrainingLog(useApi());
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
  const options: GridOptions = editing
    ? {
        open: (m) => openMembership(m, block.name),
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
        open: (m) => openMembership(m, block.name),
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
  // Plans with no day in any week, such as ones just added: named, to tap their days in.
  const dayless = members.filter((m) => !hasDays(scheduleOf(plan, m)));
  const daylessNames = dayless.map((m) => workout(m.workoutId)?.name ?? "").join(", ");
  const [added, setAdded] = useLit();
  const add = (
    <Button
      label={t("plan.addWorkout")}
      accessibilityLabel={t("plan.addToBlock", { name: block.name })}
      onPress={() => setAdding(true)}
      variant="primary"
      icon="plus"
      height={template && rows.length === 0 ? 44 : 48}
    />
  );
  const edit = onEditDays !== undefined && (
    <Button
      label={t("common.edit")}
      onPress={onEditDays}
      variant="primary"
      height={template && rows.length === 0 ? 44 : 48}
    />
  );
  const action = editing ? add : edit;
  const hint = (text: string, color: string): React.ReactElement => (
    <Text style={[type.mono, { fontSize: 11.5, lineHeight: 16, color }]}>{text}</Text>
  );

  return (
    <View style={{ gap: 12 }}>
      {rows.length === 0 && template ? (
        <View
          style={{
            minHeight: 120,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: "rgba(64,63,76,0.24)",
          }}
        >
          <Text
            style={[type.body, { fontSize: 14, textAlign: "center", color: colors.textSecondary }]}
          >
            {t("plan.templateEmpty")}
          </Text>
          {action}
        </View>
      ) : rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid
          rows={rows}
          lit={[...(lit === undefined ? [] : [lit]), ...added]}
          editing={editing}
          title={picksWeek ? undefined : t("plan.week")}
          head={
            picksWeek ? <WeekNav week={week} weeks={block.weeks} onPick={onPickWeek} /> : undefined
          }
          dates={dates === null ? undefined : dates.map((d) => String(Number(d.slice(8))))}
          columns={blockWeekColumns(block, week)}
          footer={
            editing &&
            shownWeek < block.weeks && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.lineOnLightSoft,
                }}
              >
                <Text style={[type.body, { flex: 1, fontSize: 14, color: colors.gunmetal }]}>
                  {t("plan.applyFollowing")}
                </Text>
                <Switch
                  checked={following}
                  onChange={setFollowing}
                  disabled={false}
                  label={t("plan.applyFollowing")}
                />
              </View>
            )
          }
        />
      )}
      {dayless.length > 0 &&
        (editing || onEditDays === undefined) &&
        hint(t("plan.tapDays", { workout: daylessNames }), AMBER)}
      {canAdd && !(template && rows.length === 0) && (editing || rows.length === 0) && action}
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
          onChange={(kind) => changes.open(kind, open.occurrence, open.workout.name)}
          onClose={() => setOpen(null)}
        />
      )}
      {changes.sheets}
      <AddWorkoutsSheet
        flow={{ date: null, blockId: block.id }}
        visible={adding}
        onClose={(ids) => {
          setAdding(false);
          setAdded(ids);
        }}
      />
    </View>
  );
}

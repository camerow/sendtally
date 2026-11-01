import React from "react";
import { Text, View } from "react-native";
import {
  addDays,
  blockWeekOn,
  isDated,
  weekday,
  type Block,
  type Membership,
  type Weekday,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { dayMonth } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  daysInWeek,
  ownWeeksAfter,
  scheduleOf,
  trainingDay,
  useTrainingLog,
  type Occurrence,
  type WorkoutLookup,
} from "@sendtally/features/training";
import { Switch } from "../../../components/Switch";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { AMBER } from "../components/tints";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows, type CellMark, type GridOptions } from "../plan/planGridRows";
import { DaySheet } from "../plan-days/DaySheet";
import { useDayChanges } from "../plan-days/useDayChanges";
import { useLibrary } from "../library/useLibrary";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";
import { AddWorkoutsSheet } from "./AddWorkoutsSheet";

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
};

const DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * A block's week, a row per workout opening it in the block, and + Add workout under it. On a
 * template a cell sets the workout's day; on a scheduled block a week shows its dates.
 */
export function BlockWeek({
  block,
  members,
  workout,
  lit,
  canAdd = true,
  week,
}: BlockWeekProps): React.ReactElement {
  const { model, today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const actions = usePlanActions();
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
  const [editing, setEditing] = React.useState(false);
  const [following, setFollowing] = React.useState(false);
  const shownWeek = week ?? 1;
  // Days are edited from this block week on: a past week ran as it did.
  const editable = isDated(block) && canAdd && shownWeek >= (blockWeekOn(block, today) ?? 1);
  const from = isDated(block) && week !== undefined ? addDays(block.start, (week - 1) * 7) : null;
  // A block week runs from its start's weekday, so each weekday column finds its own date.
  const dates = from === null ? null : DAYS.map((d) => addDays(from, (d - weekday(from) + 7) % 7));
  const statuses = dates === null ? null : dates.map((date) => trainingDay(log, date, today).plans);
  const marks =
    statuses === null
      ? undefined
      : (m: Membership): (CellMark | null)[] =>
          statuses.map((plans) => {
            const o = plans.find((x) => x.membership.id === m.id);
            return o === undefined
              ? null
              : o.movedFrom !== null && o.status === "planned"
                ? "movedIn"
                : o.status;
          });
  const toggleDay =
    (m: Membership, day: number, change: { following: boolean; last: number }) => () =>
      void actions.toggleWeekDay(m.id, { week: shownWeek, day: day as Weekday, ...change });
  const firstWeek = (m: Membership): readonly number[] => daysInWeek(scheduleOf(log.plan, m), 1);
  const options: GridOptions = editing
    ? {
        back: block.name,
        ...(marks !== undefined && { marks }),
        // A day gone by keeps how it went; today and later are set.
        toggle: (m: Membership, day: number) =>
          dates !== null && (dates[day] ?? today) < today
            ? undefined
            : toggleDay(m, day, { following, last: block.weeks }),
      }
    : {
        back: block.name,
        ...(template &&
          week !== undefined &&
          week > 1 && {
            week: { n: week, changes: log.plan.weekChanges, unit: model.settings.units },
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
        // On a template week 1 is as written, the days every week runs on unless one is set
        // apart; a later week sets its own and reads gold where it differs from week 1.
        ...(template && {
          toggle: (m: Membership, day: number) =>
            toggleDay(m, day, { following: false, last: shownWeek === 1 ? 1 : block.weeks }),
          ...(shownWeek > 1 && {
            rings: (m: Membership) =>
              DAYS.map((d) => m.weekdays.includes(d as Weekday) !== firstWeek(m).includes(d)),
          }),
        }),
      };
  const shown = members.map((m) => ({
    ...m,
    weekdays: daysInWeek(scheduleOf(log.plan, m), shownWeek),
  }));
  const replaced = [
    ...new Set(members.flatMap((m) => ownWeeksAfter(scheduleOf(log.plan, m), shownWeek))),
  ].sort((a, b) => a - b);
  const rows = planGridRows(shown, workout, model, options);
  // Plans with no day in any week, such as ones just added: named, to tap their days in.
  const dayless = members.filter((m) => {
    const s = scheduleOf(log.plan, m);
    return s.weekdays.length === 0 && s.weeks.every((w) => w.weekdays.length === 0);
  });
  const [added, setAdded] = React.useState<readonly string[]>([]);
  React.useEffect(() => {
    if (added.length === 0) return;
    const fade = setTimeout(() => setAdded([]), 2400);
    return () => clearTimeout(fade);
  }, [added]);
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
          {add}
        </View>
      ) : rows.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanGrid
          rows={rows}
          lit={[...(lit === undefined ? [] : [lit]), ...added]}
          editing={editing}
          action={
            editable ? (
              <Button
                label={editing ? t("common.done") : t("plan.editDays")}
                onPress={() => {
                  setFollowing(false);
                  setEditing(!editing);
                }}
                variant="link"
                height={32}
                style={{ paddingHorizontal: 0 }}
              />
            ) : undefined
          }
          title={
            from !== null && week !== undefined
              ? t("plan.weekDated", { n: week, date: dayMonth(from) })
              : template && week !== undefined && week > 1
                ? t("plan.weekNumber", { n: week })
                : undefined
          }
          dates={dates === null ? undefined : dates.map((d) => String(Number(d.slice(8))))}
          columns={from === null ? undefined : DAYS.map((i) => weekday(addDays(from, i)))}
          footer={
            editing &&
            shownWeek < block.weeks && (
              <View
                style={{
                  gap: 6,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.lineOnLightSoft,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={[type.body, { flex: 1, fontSize: 14, color: colors.gunmetal }]}>
                    {shownWeek + 1 === block.weeks
                      ? t("plan.alsoWeek", { n: block.weeks })
                      : t("plan.alsoWeeks", { from: shownWeek + 1, to: block.weeks })}
                  </Text>
                  <Switch
                    checked={following}
                    onChange={setFollowing}
                    disabled={false}
                    label={t("plan.alsoWeeks", { from: shownWeek + 1, to: block.weeks })}
                  />
                </View>
                {following &&
                  replaced.length > 0 &&
                  hint(
                    t("plan.replacesWeeks", {
                      weeks: replaced.map((n) => t("plan.weekShort", { n })).join(", "),
                    }),
                    AMBER
                  )}
              </View>
            )
          }
        />
      )}
      {dayless.length > 0 &&
        hint(
          t("plan.tapDays", {
            workout: dayless.map((m) => workout(m.workoutId)?.name ?? "").join(", "),
          }),
          AMBER
        )}
      {template &&
        week !== undefined &&
        week > 1 &&
        rows.length > 0 &&
        hint(
          rows.some((r) => r.lines.some((l) => l.some((p) => p.changed === true)))
            ? t("plan.weekGold", { n: week })
            : t("plan.weekAsWritten", { n: week }),
          colors.textSecondary
        )}
      {canAdd && !(template && rows.length === 0) && add}
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

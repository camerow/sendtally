import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Plan } from "@sendtally/api-client";
import {
  addDays,
  isDated,
  weekday,
  type Block,
  type Membership,
  type Weekday,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  daysInWeek,
  hasDays,
  scheduleOf,
  trainingDay,
  usualDays,
  useTrainingLog,
  type DayToggle,
  type Occurrence,
  type WorkoutLookup,
} from "@sendtally/features/training";
import { Switch } from "../../../components/Switch";
import { useApi } from "../../../lib/api";
import { press } from "../../../lib/press";
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
import { type } from "../type";
import { AddWorkoutsSheet } from "./AddWorkoutsSheet";
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
  /** Arrows to the week before and after, beside the title. */
  onPickWeek?: (week: number) => void;
  /** Turns on Edit mode, from the hint naming workouts with no days. */
  onEditDays?: () => void;
};

const DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * A block's week, a row per workout opening it in the block, and + Add workout under it. On a
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
  onPickWeek,
  onEditDays,
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
  const [following, setFollowing] = React.useState(false);
  const [wasEditing, setWasEditing] = React.useState(editing);
  if (editing !== wasEditing) {
    setWasEditing(editing);
    setFollowing(false);
  }
  const shownWeek = week ?? 1;
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
  const pattern = (m: Membership): readonly number[] =>
    usualDays(scheduleOf(plan, m), 1, block.weeks);
  // On a template a week reads gold where its days differ from the weeks' pattern.
  const rings = template
    ? {
        rings: (m: Membership) =>
          DAYS.map((d) => m.weekdays.includes(d as Weekday) !== pattern(m).includes(d)),
      }
    : {};
  const options: GridOptions = editing
    ? {
        back: block.name,
        ...(marks !== undefined && { marks }),
        ...rings,
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
        back: block.name,
        ...rings,
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
          head={
            onPickWeek !== undefined && week !== undefined ? (
              <WeekNav week={week} weeks={block.weeks} onPick={onPickWeek} />
            ) : undefined
          }
          dates={dates === null ? undefined : dates.map((d) => String(Number(d.slice(8))))}
          columns={from === null ? undefined : DAYS.map((i) => weekday(addDays(from, i)))}
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
            )
          }
        />
      )}
      {dayless.length > 0 &&
        (editing || onEditDays === undefined) &&
        hint(t("plan.tapDays", { workout: daylessNames }), AMBER)}
      {dayless.length > 0 && !editing && onEditDays !== undefined && (
        <Pressable onPress={onEditDays} accessibilityRole="button" style={press({})}>
          {hint(t("plan.tapEditDays", { workout: daylessNames }), AMBER)}
        </Pressable>
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

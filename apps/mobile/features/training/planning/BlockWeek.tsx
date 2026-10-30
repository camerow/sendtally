import React from "react";
import { Text, View } from "react-native";
import {
  addDays,
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
  trainingDay,
  useTrainingLog,
  type OccurrenceStatus,
  type WorkoutLookup,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { AMBER } from "../components/tints";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows, type GridOptions } from "../plan/planGridRows";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";
import { AddKindSheet } from "./AddKindSheet";

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

const toggled = (days: readonly Weekday[], day: number): Weekday[] =>
  days.includes(day as Weekday)
    ? days.filter((d) => d !== day)
    : [...days, day as Weekday].sort((a, b) => a - b);

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
  const template = !isDated(block);
  const from = isDated(block) && week !== undefined ? addDays(block.start, (week - 1) * 7) : null;
  // A block week runs from its start's weekday, so each weekday column finds its own date.
  const dates = from === null ? null : DAYS.map((d) => addDays(from, (d - weekday(from) + 7) % 7));
  const statuses = dates === null ? null : dates.map((date) => trainingDay(log, date, today).plans);
  const options: GridOptions = {
    back: block.name,
    ...(template &&
      week !== undefined &&
      week > 1 && { week: { n: week, changes: log.plan.weekChanges, unit: model.settings.units } }),
    ...(statuses !== null && {
      marks: (m: Membership): (OccurrenceStatus | null)[] =>
        statuses.map((plans) => plans.find((o) => o.membership.id === m.id)?.status ?? null),
    }),
    ...(template && {
      toggle: (m: Membership, day: number) =>
        void actions.saveMembership({ ...m, weekdays: toggled(m.weekdays, day) }),
    }),
  };
  const rows = planGridRows(members, workout, model, options);
  const dayless = rows.find((r) => r.days.length === 0);
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
          lit={lit}
          title={
            from !== null && week !== undefined
              ? t("plan.weekDated", { n: week, date: dayMonth(from) })
              : template && week !== undefined && week > 1
                ? t("plan.weekNumber", { n: week })
                : undefined
          }
          dates={dates === null ? undefined : dates.map((d) => String(Number(d.slice(8))))}
          columns={from === null ? undefined : DAYS.map((i) => weekday(addDays(from, i)))}
        />
      )}
      {template &&
        dayless !== undefined &&
        hint(t("plan.tapDays", { workout: dayless.name }), AMBER)}
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
      <AddKindSheet
        flow={{ date: null, blockId: block.id }}
        visible={adding}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}

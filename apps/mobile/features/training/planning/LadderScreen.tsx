import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import {
  blockEnd,
  blockWeekOn,
  doseIndex,
  isDated,
  letterOf,
  sessionItems,
  turnsOf,
  type Dose,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockOfMembership,
  blockRecap,
  columnLabel,
  loadColumns,
  useTrainingLog,
  weekFields,
  type DoseField,
} from "@sendtally/features/training";
import { bodySummary, exerciseName } from "@sendtally/features/workouts";
import { Chip } from "../../../components/Chip";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { Button } from "../components/Button";
import { DetailMenu } from "../components/DetailMenu";
import { Label } from "../components/Label";
import { Segmented } from "../components/Segmented";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { useRunWorkout } from "../library/useLibrary";
import { DayCell } from "../plan/DayCell";
import { workoutLines } from "../plan/planGridRows";
import { usePlanActions } from "../plan/usePlanActions";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { LoadTable } from "./LoadTable";

export type LadderScreenProps = {
  id: string;
  /** Where back goes, as that screen is called; plain Back without it. */
  back?: string;
};

/**
 * A workout in its block: its week, and its weekly load as a table of the block's weeks,
 * each changing only what differs from the workout as written.
 */
export function LadderScreen({ id, back }: LadderScreenProps): React.ReactElement | null {
  const { model, today } = useHangData();
  const unit = model.settings.units;
  const { log } = useTrainingLog(useApi());
  const actions = usePlanActions();
  const [turn, setTurn] = React.useState(0);
  const [picked, setPicked] = React.useState(0);
  const [added, setAdded] = React.useState<Record<string, DoseField[]>>({});
  const [adding, setAdding] = React.useState(false);
  const { plan } = log;
  const m = plan.memberships.find((x) => x.id === id);
  const block = m === undefined ? null : blockOfMembership(plan, m);
  const w = m === undefined ? undefined : log.workout(m.workoutId);
  const library = useRunWorkout(m?.workoutId ?? null);
  if (m === undefined || w === undefined || block === null) return null;
  const look = KIND_LOOK[w.kind];
  const turns = turnsOf(w.items);
  const items = sessionItems(w.items, turn);
  const index = Math.min(picked, items.length - 1);
  const item = items[index];
  const dose = doseIndex(w.items[index] ?? { doses: [] }, turn);
  const weeks = Array.from({ length: block.weeks }, (_, i) => i + 1);
  const changes = weeks.map(
    (week) =>
      plan.weekChanges.find(
        (c) => c.membershipId === id && c.week === week && c.dose === dose && c.item === index
      )?.change ?? {}
  );
  const key = `${turn}:${index}`;
  const columns =
    item === undefined ? [] : loadColumns(w.kind, item.dose, changes, added[key] ?? []);
  const more =
    item === undefined ? [] : weekFields(w.kind, item.dose).filter((f) => !columns.includes(f));
  const current = blockWeekOn(block, today);
  const dated = isDated(block) ? block : null;
  const ended = dated !== null && blockEnd(dated) <= today;
  const ran =
    dated === null
      ? undefined
      : blockRecap(log, dated, today).workouts.find((r) => r.membershipId === id)?.weeks;
  const done = weeks.map((week) =>
    ended || (current !== null && week <= current) ? (ran?.[week - 1] ?? null) : null
  );
  const lines =
    w.kind === "hangboard" ? (bodySummary(w)?.split(" · ") ?? []) : workoutLines(w, model.gripName);
  const mine = library?.source === "mine";
  const days: readonly number[] = m.weekdays;

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
      action={
        <DetailMenu
          rows={[
            {
              icon: "pencil",
              title: t("hang.editWorkout"),
              hint: t("plan.editWorkoutHint"),
              onPress: () =>
                router.push({
                  pathname: "/workout/edit",
                  params: mine ? { id: w.id } : { from: w.id },
                }),
            },
            {
              icon: "trash",
              title: t("plan.removeFromBlock"),
              hint: t("plan.removeFromBlockHint"),
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
      <View style={{ gap: 3 }}>
        <View style={{ flexDirection: "row", gap: 5 }}>
          {weekdayLetters().map((letter, i) => (
            <Label
              key={i}
              small
              color={colors.textSecondary}
              style={{ width: 30, textAlign: "center" }}
            >
              {letter}
            </Label>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 5 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <DayCell key={day} kind={w.kind} on={days.includes(day)} size={30} />
          ))}
        </View>
      </View>
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
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Label color={colors.gunmetal}>{t("plan.weeklyLoad")}</Label>
          {more.length > 0 && (
            <Button
              label={`+ ${t("plan.addColumn")}`}
              onPress={() => setAdding(!adding)}
              variant="link"
              height={36}
            />
          )}
        </View>
        {adding && more.length > 0 && item !== undefined && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {more.map((f) => (
              <Chip
                key={f}
                label={columnLabel(w.kind, item.dose, f)}
                uppercase={false}
                active={false}
                onPress={() => {
                  setAdded({ ...added, [key]: [...(added[key] ?? []), f] });
                  setAdding(false);
                }}
              />
            ))}
          </View>
        )}
        {items.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {items.map((it, i) => (
                <Chip
                  key={i}
                  label={exerciseName(it.exercise, model.gripName)}
                  uppercase={false}
                  active={i === index}
                  onPress={() => setPicked(i)}
                />
              ))}
            </View>
          </ScrollView>
        )}
        {item !== undefined && (
          <LoadTable
            key={key}
            kind={w.kind}
            written={item.dose}
            changes={changes}
            columns={columns}
            unit={unit}
            current={current}
            done={done}
            onChange={(week, change: Partial<Dose>) =>
              void actions.saveWeekChange({ membershipId: id, week, dose, item: index, change })
            }
          />
        )}
        <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
          {t("plan.loadHint")}
        </Text>
      </View>
    </ScreenFrame>
  );
}

import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { byDate, summarise, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel, setText, useWeightUnit } from "@sendtally/features/activities";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  exerciseSummary,
  useExerciseSeries,
  useExercises,
  workoutsUsing,
} from "@sendtally/features/statistics";
import { doseSummary } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { pressRow } from "../../../lib/press";
import { DashedPanel } from "../components/DashedPanel";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { CategoryMark } from "../library/CategoryMark";
import { useLibrary } from "../library/useLibrary";
import { type } from "../type";

type Card = { key: string; name: string; meta: string; open: () => void };

export const EXERCISE_SHELVES = ["strength", "mobility", "other"] as const;

function Shelf({ kind, cards }: { kind: WorkoutKind; cards: Card[] }): React.ReactElement {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <CategoryMark kind={kind} size={28} />
        <Title size={26}>{kindLabel(kind)}</Title>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -18 }}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 18 }}
      >
        {cards.map((c) => (
          <Pressable
            key={c.key}
            onPress={c.open}
            accessibilityRole="button"
            style={pressRow({
              width: 184,
              minHeight: 96,
              padding: 14,
              gap: 8,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.lineOnLight,
            })}
          >
            <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{c.name}</Text>
            <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{c.meta}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/** Train > Exercises: a shelf per kind, each exercise with its best result or its last dose. */
export function ExerciseShelves(): React.ReactElement {
  const api = useApi();
  const { model, today } = useHangData();
  const exercises = useExercises(api);
  const series = useExerciseSeries(api);
  const library = useLibrary().state;
  const unit = useWeightUnit(api);
  if (exercises.state.status !== "ready")
    return <LoadState state={exercises.state} onRetry={() => void exercises.reload()} />;

  const list = exercises.state.data;
  const workouts = library.status === "ready" ? library.data.workouts : [];
  const logged = series.status === "ready" ? series.data : [];
  const metaOf = (name: string): string => {
    const s = logged.find((x) => x.key === exerciseKey(name));
    const best = s === undefined ? null : exerciseSummary(s, today)?.best;
    if (best !== undefined && best !== null)
      return t("workouts.exerciseBest", { value: setText(best.best, unit) });
    const using = workoutsUsing(workouts, name)[0];
    const item = using?.variations
      .flatMap((v) => v.items)
      .find((i) => exerciseKey(i.exercise) === exerciseKey(name));
    return using === undefined || item === undefined
      ? ""
      : t("workouts.exerciseLast", { value: doseSummary(using.kind, item.dose, unit) });
  };

  const grips: Card[] = model.grips
    .filter((g) => !g.hidden && model.sessions.some((s) => s.gripId === g.id))
    .map((g) => {
      const onGrip = model.sessions.filter((s) => s.gripId === g.id).sort(byDate);
      const last = onGrip.at(-1);
      const summary = summarise(onGrip, today);
      return {
        key: g.id,
        name: g.name,
        meta:
          summary === null || last === undefined
            ? ""
            : t("workouts.exerciseBest", {
                value: loadLabel(last.protocol.kind, summary.best, model.settings.units),
              }),
        open: () =>
          last !== undefined &&
          router.push({
            pathname: "/workout/[id]",
            params: { id: last.workoutId, grip: g.id },
          }),
      };
    });
  const shelves = [
    { kind: "hangboard" as const, cards: grips },
    ...EXERCISE_SHELVES.map((kind) => ({
      kind,
      cards: list
        .filter((e) => e.kind === kind)
        .map((e): Card => ({
          key: e.id,
          name: e.name,
          meta: metaOf(e.name),
          open: () => router.push({ pathname: "/exercise/[id]", params: { id: e.id } }),
        })),
    })),
  ].filter((s) => s.cards.length > 0);

  if (shelves.length === 0) return <DashedPanel body={t("statistics.exercisesEmpty")} />;
  return (
    <View style={{ gap: 20 }}>
      {shelves.map((s) => (
        <Shelf key={s.kind} kind={s.kind} cards={s.cards} />
      ))}
    </View>
  );
}

import { router } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doneAsPrescribed, type ItemDone, type SetDone } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  changeSet,
  climbingLastTime,
  climbsLine,
  previousSets,
  useActivities,
  useWeightUnit,
  wallLine,
} from "@sendtally/features/activities";
import { tallyMeasuresOf, type TallyMeasure } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { exerciseSets, startExercise, useLiveSession } from "@sendtally/features/log-session";
import { useExercises } from "@sendtally/features/statistics";
import { exerciseName } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { exerciseTallyStorage } from "../../../lib/exerciseTallyStorage";
import { Button } from "../components/Button";
import { PlayerHeader } from "../components/PlayerHeader";
import { logRun, type WorkoutRun } from "../data/workoutRunParams";
import { RestRow } from "../rest/RestRow";
import { useRest } from "../rest/useRest";
import { ClimbingCard } from "./ClimbingCard";
import { FoldedSetsCard } from "./FoldedSetsCard";
import { SetsCard } from "./SetsCard";
import {
  afterKey,
  allSets,
  isLifting,
  itemDone,
  restAfterTick,
  setKey,
  tickedDone,
  withPrevious,
  type SetAt,
} from "./setsRun";

/**
 * A lifting workout as a set table on a clock from Start: tick each set as it is done, rest
 * in line after it, then log what was done. A climbing exercise is a card instead, whose Start
 * logs it on the session tally; its climbs come back as its sets.
 */
export function SetsScreen({ run }: { run: WorkoutRun }): React.ReactElement {
  const api = useApi();
  const unit = useWeightUnit(api);
  const { state: activities } = useActivities(api);
  const exercises = useExercises(api).state;
  const tally = useLiveSession(exerciseTallyStorage);
  const climbs = tally.stored?.draft.climbs ?? [];
  const [startedAt] = React.useState(Date.now);
  const [done, setDone] = React.useState<ItemDone[]>(() => doneAsPrescribed(run.items));
  const [ticked, setTicked] = React.useState<ReadonlySet<string>>(new Set());
  const [opened, setOpened] = React.useState<ReadonlySet<number>>(new Set());
  const rest = useRest();
  React.useEffect(() => () => exerciseTallyStorage.remove(), []);
  const tallyMeasure = tallyMeasuresOf(
    exercises.status === "ready" ? exercises.data : [],
    run.kind
  );
  const tallyOf = (item: number): TallyMeasure | null =>
    tallyMeasure(run.items[item]?.exercise ?? "");
  const sets = allSets(run.items).filter((at) => tallyOf(at.item) === null);
  const previous = (exercise: string): SetDone[] =>
    activities.status === "ready" ? previousSets(activities.data, run.workoutId, exercise) : [];
  const lifting = (item: number): boolean => isLifting(run.kind, run.items[item]);
  const shown = withPrevious(done, lifting, previous);
  const current = sets.find((at) => !ticked.has(setKey(at))) ?? null;
  const nameOf = (item: number): string => exerciseName(run.items[item]?.exercise ?? "");

  const toggle = (at: SetAt): void => {
    const key = setKey(at);
    const next = new Set(ticked);
    const ticking = !next.delete(key);
    if (ticking) next.add(key);
    setTicked(next);
    setOpened((was) => new Set([...was].filter((i) => i !== at.item)));
    const after = ticking ? restAfterTick(run.items, next, at, run.exerciseRestS) : null;
    if (after === null) rest.skip();
    else rest.tick(after.at, after.seconds, after.next === null ? undefined : nameOf(after.next));
  };
  const change = (item: number, set: number, value: SetDone): void =>
    setDone((all) => changeSet(all, item, set, value));
  const restAt = (key: string): React.ReactNode =>
    rest.rest?.at === key && (
      <RestRow rest={rest.rest} left={rest.left} onMore={rest.more} onSkip={rest.skip} />
    );
  const climbedSets = (item: number): SetDone[] =>
    exerciseSets(
      climbs,
      item,
      tallyOf(item) === "wallTime" ? run.items[item]?.dose.onS : undefined
    );
  const finish = (): void =>
    logRun(
      run,
      tickedDone(shown, ticked).map((d) =>
        tallyOf(d.item) === null ? d : { ...d, sets: climbedSets(d.item) }
      ),
      startedAt
    );
  const startClimbing = (item: number, measure: TallyMeasure): void => {
    const at = run.items[item];
    if (at === undefined) return;
    if (tally.stored?.draft.exercise?.item !== item)
      tally.replace(
        startExercise(
          tally.stored?.draft ?? null,
          {
            item,
            name: nameOf(item),
            sets: at.dose.sets,
            ...(measure === "climbs" && at.dose.reps !== undefined ? { climbs: at.dose.reps } : {}),
            ...(measure === "wallTime" ? { onS: at.dose.onS ?? 0 } : {}),
            restS: at.dose.setRestS ?? 0,
          },
          new Date()
        )
      );
    rest.skip();
    router.push("/workout/tally");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingBottom: 24 }}
        >
          <PlayerHeader
            kind={run.kind}
            focus={run.link.focus}
            title={run.title}
            minutes={run.minutes}
            workoutId={run.workoutId}
            startedAt={startedAt}
          />
          {run.items.map((item, i) => {
            const d = shown[i];
            if (d === undefined) return null;
            const measure = tallyOf(i);
            if (measure !== null) {
              const logged = climbedSets(i);
              return (
                <ClimbingCard
                  key={i}
                  item={item}
                  measure={measure}
                  lastTime={climbingLastTime(previous(d.exercise), measure)}
                  logged={
                    logged.length === 0
                      ? null
                      : measure === "wallTime"
                        ? wallLine(logged)
                        : climbsLine(logged)
                  }
                  live={tally.stored?.draft.exercise?.item === i}
                  onStart={() => startClimbing(i, measure)}
                />
              );
            }
            const folded = itemDone(run.items, ticked, i) && !opened.has(i);
            return (
              <React.Fragment key={i}>
                {folded ? (
                  <FoldedSetsCard
                    name={nameOf(i)}
                    sets={item.dose.sets}
                    onOpen={() => setOpened((was) => new Set([...was, i]))}
                  />
                ) : (
                  <SetsCard
                    item={item}
                    done={d}
                    previous={previous(d.exercise)}
                    lifting={lifting(i)}
                    ticked={ticked}
                    current={current}
                    unit={unit}
                    onChange={(set, value) => change(i, set, value)}
                    onToggle={(set) => toggle({ item: i, set })}
                    restUnder={(set) => restAt(setKey({ item: i, set }))}
                  />
                )}
                {restAt(afterKey(i))}
              </React.Fragment>
            );
          })}
        </ScrollView>
        <View
          style={{
            paddingTop: 12,
            paddingHorizontal: 18,
            paddingBottom: 10,
            borderTopWidth: 1,
            borderTopColor: colors.lineOnLight,
          }}
        >
          <Button label={t("activities.finish")} onPress={finish} variant="primary" height={54} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

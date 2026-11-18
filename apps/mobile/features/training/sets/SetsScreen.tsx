import { router } from "expo-router";
import React from "react";
import { restAfterItem } from "@sendtally/core/hang";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { foldedLine, useActivities, useWeightUnit } from "@sendtally/features/activities";
import { exerciseAbout, type TallyMeasure } from "@sendtally/features/exercises";
import { useGrips } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import { useLiveSession } from "@sendtally/features/log-session";
import { useExercises } from "@sendtally/features/statistics";
import {
  afterKey,
  heldSeconds,
  setKey,
  useSetsPlayer,
  type SetAt,
  type WorkoutRun,
} from "@sendtally/features/workouts";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { Toast } from "../../../components/Toast";
import { useApi } from "../../../lib/api";
import { exerciseTallyStorage } from "../../../lib/exerciseTallyStorage";
import { liveRun } from "../../live-session/liveRun";
import { Button } from "../components/Button";
import { PlayerHeader } from "../components/PlayerHeader";
import { logRun } from "../data/workoutRunParams";
import { HoldButton } from "../hold/HoldButton";
import { HoldRow } from "../hold/HoldRow";
import { RestPreview } from "../rest/RestPreview";
import { RestRow } from "../rest/RestRow";
import { type } from "../type";
import { ExercisePickerSheet } from "../exercise-picker/ExercisePickerSheet";
import type { DetailMenuRow } from "../components/types";
import { ClimbingCard } from "./ClimbingCard";
import { FoldedSetsCard } from "./FoldedSetsCard";
import { SET_COLUMNS } from "./setColumns";
import { SetsCard } from "./SetsCard";
import { FingersCard } from "./FingersCard";

/**
 * A lifting workout as a set table on a clock from Start: tick each set as it is done, rest
 * in line after it, then log what was done. A climbing exercise is a card instead, whose Start
 * logs it on the session tally; its climbs come back as its sets.
 */
export function SetsScreen({
  run,
  end = false,
}: {
  run: WorkoutRun;
  /** Finishes the running workout as it opens, straight to its review. */
  end?: boolean;
}): React.ReactElement {
  const api = useApi();
  const unit = useWeightUnit(api);
  const { state: activities } = useActivities(api);
  const exercises = useExercises(api).state;
  const mine = exercises.status === "ready" ? exercises.data : null;
  const tally = useLiveSession(exerciseTallyStorage);
  const [keypad, setKeypad] = React.useState(false);
  const grips = useGrips(api);
  const [removed, setRemoved] = React.useState<{ message: string; undo: () => void } | null>(null);
  const [picking, setPicking] = React.useState(false);
  const player = useSetsPlayer({
    run,
    store: liveRun,
    tally,
    activities: activities.status === "ready" ? activities.data : null,
    exercises: mine,
    isGrip: grips.isGrip,
  });
  const { part } = player;
  const { shown, ticked, current, rest, hold, previous, nameOf, items, order } = player;

  const holdRow = (at: SetAt): React.ReactNode =>
    hold.hold?.at === setKey(at) && (
      <HoldRow
        hold={hold.hold}
        now={hold.now}
        lead={
          <Text style={[type.monoBold, SET_COLUMNS.set, { fontSize: 14, color: colors.gunmetal }]}>
            {formatNumber(at.set + 1)}
          </Text>
        }
        onPause={hold.pause}
        onResume={hold.resume}
        onDone={() => {
          if (hold.hold !== null) player.endHold(hold.hold, heldSeconds(hold.hold, Date.now()));
        }}
      />
    );
  const go = (at: SetAt): React.ReactNode => {
    const targetS = player.holdTarget(at);
    return (
      targetS !== null && (
        <HoldButton name={nameOf(at.item)} targetS={targetS} onPress={() => player.startHold(at)} />
      )
    );
  };
  const restAt = (key: string): React.ReactNode =>
    rest.rest?.at === key && (
      <RestRow rest={rest.rest} left={rest.left} onMore={rest.more} onSkip={rest.skip} />
    );
  const restBetween = (item: number): React.ReactNode =>
    restAt(afterKey(item)) || (
      <RestPreview seconds={restAfterItem(items, item, run.exerciseRestS)} />
    );
  const finish = (): void => {
    const { done, off, lastTickAt } = player.finished();
    logRun(run, done, player.startedAt, off, lastTickAt);
  };
  const ending = React.useRef(end);
  const loaded = exercises.status !== "loading" && activities.status !== "loading";
  React.useEffect(() => {
    if (!ending.current || !loaded) return;
    ending.current = false;
    finish();
  });
  const startClimbing = (item: number, measure: TallyMeasure): void => {
    player.startClimbing(item, measure);
    router.push("/workout/tally");
  };
  const menu = (i: number, at: number): DetailMenuRow[] => [
    { icon: "skip", title: t("workouts.skipForNow"), onPress: () => player.skip(i) },
    ...(at > 0
      ? [
          {
            icon: "up" as const,
            title: t("workouts.moveUpShort"),
            onPress: () => player.move(i, -1),
          },
        ]
      : []),
    ...(at < order.length - 1
      ? [
          {
            icon: "down" as const,
            title: t("workouts.moveDownShort"),
            onPress: () => player.move(i, 1),
          },
        ]
      : []),
    {
      icon: "trash",
      title: t("workouts.removeShort"),
      danger: true,
      onPress: () =>
        Alert.alert(
          t("workouts.removeExercise", { name: nameOf(i) }),
          t("workouts.removeFromRunBody"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("workouts.removeShort"),
              style: "destructive",
              onPress: () => player.remove(i),
            },
          ]
        ),
    },
  ];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          <KeypadScrollView
            onKeypadChange={setKeypad}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingBottom: 24 }}
          >
            <PlayerHeader
              kind={run.kind}
              title={run.title}
              workoutId={run.workoutId}
              startedAt={player.startedAt}
              position={player.position}
              bare={run.items.length === 0}
            />
            {order.map((i, at) => {
              const item = items[i];
              const d = shown.find((x) => x.item === i);
              if (item === undefined || d === undefined) return null;
              const between = at < order.length - 1 && restBetween(i);
              if (part !== null && part.places.includes(i))
                return (
                  i === part.places[0] && (
                    <React.Fragment key={i}>
                      <FingersCard
                        part={part}
                        unit={unit}
                        gripName={grips.gripName}
                        onStart={() =>
                          router.push({
                            pathname: "/workout/timer",
                            params: { workoutId: run.workoutId, gripId: item.exercise, part: "1" },
                          })
                        }
                        onRemoved={(message, undo) => setRemoved({ message, undo })}
                      />
                      {between}
                    </React.Fragment>
                  )
                );
              const climbing = player.climbing(i);
              if (climbing !== null)
                return (
                  <React.Fragment key={i}>
                    <ClimbingCard
                      item={item}
                      {...climbing}
                      onStart={() => startClimbing(i, climbing.measure)}
                    />
                    {between}
                  </React.Fragment>
                );
              const skipped = player.skipped(i);
              return (
                <React.Fragment key={i}>
                  {player.folded(i) ? (
                    <FoldedSetsCard
                      name={nameOf(i)}
                      line={skipped ? t("workouts.skippedTapToDo") : foldedLine(d.sets, unit)}
                      done={
                        !skipped &&
                        d.sets.length > 0 &&
                        d.sets.every((_, set) => ticked.has(setKey({ item: i, set })))
                      }
                      onOpen={() => player.open(i)}
                    />
                  ) : (
                    <SetsCard
                      item={item}
                      done={d}
                      target={(set) => player.target({ item: i, set })}
                      previous={previous(d.exercise)}
                      lifting={player.lifting(i)}
                      ticked={ticked}
                      current={current}
                      unit={unit}
                      onChange={(set, value) => player.change(i, set, value)}
                      onToggle={(set) => player.toggle({ item: i, set })}
                      holdRow={(set) => holdRow({ item: i, set })}
                      go={(set) => go({ item: i, set })}
                      restUnder={(set) => restAt(setKey({ item: i, set }))}
                      about={exerciseAbout(mine, item.exercise, nameOf(i))}
                      onFocus={(set) => player.focus({ item: i, set })}
                      onRemoveSet={(set) => player.removeSet({ item: i, set })}
                      onAddSet={() => player.addSet(i)}
                      onFold={() => player.fold(i)}
                      menu={menu(i, at)}
                    />
                  )}
                  {between}
                </React.Fragment>
              );
            })}
            {run.items.length > 0 && (
              <Button
                label={t("workouts.addExercise")}
                onPress={() => setPicking(true)}
                variant="outline"
                icon="plus"
              />
            )}
          </KeypadScrollView>
          {player.removed !== null && (
            <Toast
              message={`${player.removed.exercise} · ${t("activities.setRemoved", { n: player.removed.set })}`}
              action={{ label: t("tally.undo"), onPress: player.undoRemove }}
              onHide={player.dismissRemoved}
              bottom={12}
            />
          )}
          {removed !== null && (
            <Toast
              message={removed.message}
              action={{ label: t("tally.undo"), onPress: removed.undo }}
              onHide={() => setRemoved(null)}
              bottom={12}
            />
          )}
        </View>
        {picking && (
          <ExercisePickerSheet
            items={items.map((x) => ({ exercise: x.exercise, doses: [x.dose] }))}
            multi
            onPick={(picked) => picked.forEach(player.addExercise)}
            onClose={() => setPicking(false)}
          />
        )}
        {!keypad && (
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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

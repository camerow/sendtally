import { router } from "expo-router";
import React from "react";
import { restAfterItem } from "@sendtally/core/hang";
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import {
  climbingDoseLine,
  foldedLine,
  useActivities,
  useWeightUnit,
} from "@sendtally/features/activities";
import { exerciseAbout } from "@sendtally/features/exercises";
import { useGrips } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import { useLiveSession, withLapBack } from "@sendtally/features/log-session";
import { useExercises } from "@sendtally/features/statistics";
import {
  climbRows,
  afterKey,
  heldSeconds,
  setKey,
  useSetsPlayer,
  type SetAt,
  type WorkoutRun,
  checklistLine,
  runItems,
  supersetMembers,
  supersetRoundsTitle,
  type RunGroup,
} from "@sendtally/features/workouts";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { Toast } from "../../../components/Toast";
import { useApi } from "../../../lib/api";
import { exerciseTallyStorage } from "../../../lib/exerciseTallyStorage";
import { GymSheet } from "../../live-session/GymSheet";
import { LiveClimbEditor } from "../../live-session/LiveClimbEditor";
import { liveRun } from "../../live-session/liveRun";
import { UndoSnackbar } from "../../live-session/UndoSnackbar";
import { ClimbCard } from "../climbing/ClimbCard";
import { LapsCard } from "../climbing/LapsCard";
import { useWorkoutTally } from "../climbing/useWorkoutTally";
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
import { ChecklistCard } from "./ChecklistCard";
import { openExerciseHistory } from "../exercises/openExerciseHistory";
import { SupersetCard } from "./SupersetCard";
import { FoldedSetsCard } from "./FoldedSetsCard";
import { SET_COLUMNS } from "./setColumns";
import { SetsCard } from "./SetsCard";
import { FingersCard } from "./FingersCard";

/**
 * A workout as a set table on a clock from Start: tick each set as it is done, rest in line
 * after it, then log what was done. A climbing exercise's sets take a row per climb on the
 * workout's tally; its climbs come back as its sets.
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
  const { shown, ticked, rest, hold, nameOf, items, order } = player;
  const climbs = useWorkoutTally(tally, rest);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [pickingGym, setPickingGym] = React.useState(false);
  const [lapRemoved, setLapRemoved] = React.useState<{
    item: number;
    name: string;
    lap: number;
  } | null>(null);
  const draft = climbs.draft;
  const editingClimb = draft?.climbs.find((c) => c.key === editing) ?? null;
  const climbing = items.some((_, i) => player.tallyOf(i) !== null);

  const holdRow = (at: SetAt): React.ReactNode =>
    hold.hold?.at === setKey(at) && (
      <HoldRow
        hold={hold.hold}
        now={hold.now}
        lead={
          <Text
            style={[type.mono, SET_COLUMNS.position, { fontSize: 12, color: colors.textMuted }]}
          >
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
        <HoldButton
          name={nameOf(at.item)}
          targetS={targetS}
          disabled={hold.hold !== null}
          onPress={() => player.startHold(at)}
        />
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
  const removeRow = (i: number, title: string): DetailMenuRow => ({
    icon: "trash",
    title,
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
  });
  // A superset's menu works on one member: the one left after it goes plays as a plain exercise.
  const groupMenu = (g: RunGroup): DetailMenuRow[] => [
    ...(player.canMove(g.members[0] ?? -1, -1)
      ? [
          {
            icon: "moveUp" as const,
            title: t("workouts.moveUpShort"),
            onPress: () => player.move(g.members[0] ?? -1, -1),
          },
        ]
      : []),
    ...(player.canMove(g.members[0] ?? -1, 1)
      ? [
          {
            icon: "moveDown" as const,
            title: t("workouts.moveDownShort"),
            onPress: () => player.move(g.members[0] ?? -1, 1),
          },
        ]
      : []),
    ...g.members.map((m): DetailMenuRow => ({
      icon: "skip",
      title: t("workouts.skipMemberForNow", { name: nameOf(m) }),
      onPress: () => player.skip(m),
    })),
    ...g.members.map((m) => removeRow(m, t("workouts.removeExercise", { name: nameOf(m) }))),
  ];
  const menu = (i: number): DetailMenuRow[] => [
    ...(player.canClimbOn(i)
      ? [
          {
            icon: "climb" as const,
            title: t("workouts.climbNow"),
            onPress: () => player.climbOn(i),
          },
        ]
      : []),
    { icon: "skip", title: t("workouts.skipForNow"), onPress: () => player.skip(i) },
    ...(player.canMove(i, -1)
      ? [
          {
            icon: "moveUp" as const,
            title: t("workouts.moveUpShort"),
            onPress: () => player.move(i, -1),
          },
        ]
      : []),
    ...(player.canMove(i, 1)
      ? [
          {
            icon: "moveDown" as const,
            title: t("workouts.moveDownShort"),
            onPress: () => player.move(i, 1),
          },
        ]
      : []),
    removeRow(i, t("workouts.removeShort")),
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
            contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}
          >
            <Pressable
              accessible={false}
              testID="run-body"
              onPress={() => {
                if (player.selected !== null) player.select(player.selected);
              }}
              style={{ gap: 10 }}
            >
              <PlayerHeader
                kind={run.kind}
                title={run.title}
                workoutId={run.workoutId}
                startedAt={player.startedAt}
                position={player.position}
                bare={run.items.length === 0}
                gym={
                  climbing
                    ? { name: climbs.gym?.name, onPick: () => setPickingGym(true) }
                    : undefined
                }
              />
              {order.map((i, at) => {
                const item = items[i];
                const d = shown.find((x) => x.item === i);
                if (item === undefined || d === undefined) return null;
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
                              params: {
                                workoutId: run.workoutId,
                                gripId: item.exercise,
                                part: "1",
                              },
                            })
                          }
                          onRemoved={(message, undo) => setRemoved({ message, undo })}
                        />
                        {at < order.length - 1 && restBetween(i)}
                      </React.Fragment>
                    )
                  );
                const g = player.groups.find((x) => x.members.includes(i));
                if (g !== undefined) {
                  if (g.members[0] !== i) return null;
                  const last = g.members[g.members.length - 1] ?? i;
                  const names = g.members.map((m) => nameOf(m));
                  const allDone = g.members.every((m) =>
                    (shown.find((x) => x.item === m)?.sets ?? []).every((_, set) =>
                      ticked.has(setKey({ item: m, set }))
                    )
                  );
                  return (
                    <React.Fragment key={i}>
                      {g.members.every((m) => player.folded(m)) ? (
                        <FoldedSetsCard
                          name={supersetMembers(names)}
                          line={supersetRoundsTitle(
                            Math.max(...g.members.map((m) => player.live[m]?.dose.sets ?? 0))
                          )}
                          done={allDone}
                          onOpen={() => g.members.forEach((m) => player.open(m))}
                        />
                      ) : (
                        <SupersetCard
                          group={g}
                          items={player.live}
                          done={shown}
                          lifting={player.lifting}
                          ticked={ticked}
                          selected={player.selected}
                          unit={unit}
                          onChange={(a, value) => player.change(a.item, a.set, value)}
                          onToggle={player.toggle}
                          holdRow={holdRow}
                          go={go}
                          restUnder={(a) => restAt(setKey(a))}
                          onSelect={player.select}
                          onRemoveSet={player.removeSet}
                          onAddRound={() => player.addSet(i)}
                          onFold={() => g.members.forEach((m) => player.fold(m))}
                          menu={groupMenu(g)}
                          onHistory={(m) => openExerciseHistory(mine, items[m]?.exercise ?? "")}
                        />
                      )}
                      {order.indexOf(last) < order.length - 1 && restBetween(last)}
                    </React.Fragment>
                  );
                }
                const climbItem = player.climbing(i);
                const skipped = player.skipped(i);
                const between = at < order.length - 1 && restBetween(i);
                if (climbItem !== null) {
                  const about = exerciseAbout(mine, item.exercise, nameOf(i));
                  const card = player.folded(i) ? (
                    <FoldedSetsCard
                      name={nameOf(i)}
                      line={
                        skipped
                          ? t("plan.skipped")
                          : (climbItem.logged ?? climbingDoseLine(item.dose, climbItem.measure))
                      }
                      done={!skipped && climbItem.logged !== null}
                      onOpen={() => player.open(i)}
                    />
                  ) : climbItem.measure === "laps" ? (
                    <LapsCard
                      item={i}
                      at={item}
                      logged={player.climbedSets(i)}
                      planned={player.lapsPlanned(i)}
                      draft={draft}
                      live={tally}
                      rest={rest}
                      now={climbs.now}
                      unit={unit}
                      about={about}
                      onHistory={openExerciseHistory(mine, item.exercise)}
                      onFold={() => player.fold(i)}
                      menu={menu(i)}
                      onLapRemoved={(lap) => setLapRemoved({ item: i, name: nameOf(i), lap })}
                    />
                  ) : (
                    <ClimbCard
                      item={item}
                      plan={player.climbPlan(i)}
                      rows={climbRows(draft, i, player.climbPlan(i), climbs.now)}
                      unit={unit}
                      tally={player.climbAt === i ? climbs : null}
                      restUnder={(set) => restAt(setKey({ item: i, set }))}
                      about={about}
                      onHistory={openExerciseHistory(mine, item.exercise)}
                      onFold={() => player.fold(i)}
                      menu={menu(i)}
                      onEdit={setEditing}
                    />
                  );
                  return (
                    <React.Fragment key={i}>
                      {card}
                      {between}
                    </React.Fragment>
                  );
                }
                const lines = player.checklist(i);
                const tickedLine = (set: number): boolean => ticked.has(setKey({ item: i, set }));
                if (lines !== null)
                  return (
                    <React.Fragment key={i}>
                      {player.folded(i) ? (
                        <FoldedSetsCard
                          name={t("workouts.checklist")}
                          line={
                            skipped
                              ? t("plan.skipped")
                              : checklistLine(
                                  lines.filter((_, n) => tickedLine(n)).length,
                                  lines.length
                                )
                          }
                          done={!skipped && lines.every((_, n) => tickedLine(n))}
                          onOpen={() => player.open(i)}
                        />
                      ) : (
                        <ChecklistCard
                          lines={lines}
                          ticked={tickedLine}
                          onToggle={(set) => player.toggle({ item: i, set })}
                          onFold={() => player.fold(i)}
                          menu={menu(i)}
                        />
                      )}
                      {between}
                    </React.Fragment>
                  );
                return (
                  <React.Fragment key={i}>
                    {player.folded(i) ? (
                      <FoldedSetsCard
                        name={nameOf(i)}
                        line={skipped ? t("plan.skipped") : foldedLine(d.sets, unit)}
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
                        lifting={player.lifting(i)}
                        eachSide={player.sided(item.exercise)}
                        ticked={ticked}
                        selected={player.selected}
                        unit={unit}
                        onChange={(set, value) => player.change(i, set, value)}
                        onToggle={(set) => player.toggle({ item: i, set })}
                        holdRow={(set) => holdRow({ item: i, set })}
                        go={(set) => go({ item: i, set })}
                        restUnder={(set) => restAt(setKey({ item: i, set }))}
                        about={exerciseAbout(mine, item.exercise, nameOf(i))}
                        onSelect={(set) => player.select({ item: i, set })}
                        onRemoveSet={(set) => player.removeSet({ item: i, set })}
                        onAddSet={() => player.addSet(i)}
                        onFold={() => player.fold(i)}
                        menu={menu(i)}
                        onHistory={openExerciseHistory(mine, item.exercise)}
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
            </Pressable>
          </KeypadScrollView>
          {climbs.snack !== null && (
            <UndoSnackbar
              id={climbs.snack.id}
              message={climbs.snack.message}
              bottom={12}
              onUndo={climbs.undo}
              onExpire={climbs.clearSnack}
            />
          )}
          {lapRemoved !== null && (
            <Toast
              message={`${lapRemoved.name} · ${t("tally.lapRemoved", { lap: lapRemoved.lap })}`}
              action={{
                label: t("tally.undo"),
                onPress: () => {
                  if (draft !== null) tally.replace(withLapBack(draft, lapRemoved.item));
                },
              }}
              onHide={() => setLapRemoved(null)}
              bottom={12}
            />
          )}
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
        <LiveClimbEditor
          climb={editingClimb}
          index={editingClimb === null || draft === null ? 0 : draft.climbs.indexOf(editingClimb)}
          count={draft?.climbs.length ?? 0}
          prefs={climbs.scales}
          vocabulary={climbs.vocabulary}
          gyms={climbs.circuitGym === null ? [] : [climbs.circuitGym]}
          onChange={(c) => tally.updateClimb(c.key, () => c, climbs.gyms)}
          onRemove={() => {
            if (editing !== null && draft !== null)
              tally.replace({ ...draft, climbs: draft.climbs.filter((c) => c.key !== editing) });
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
        {climbing && (
          <GymSheet
            visible={pickingGym}
            gyms={climbs.gyms}
            gymId={draft?.gymId}
            onPick={(gymId) => {
              climbs.pickGym(gymId);
              setPickingGym(false);
            }}
            onClose={() => setPickingGym(false)}
          />
        )}
        {picking && (
          <ExercisePickerSheet
            items={runItems(items)}
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

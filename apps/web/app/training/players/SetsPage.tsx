import React from "react";
import { useHangData } from "../data/HangDataContext";
import { useNavigate } from "react-router";
import { restAfterItem } from "@sendtally/core/hang";
import { climbingDoseLine, foldedLine, useActivities } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { useLiveSession } from "@sendtally/features/log-session";
import { exerciseAbout } from "@sendtally/features/exercises";
import { useGrips } from "@sendtally/features/hang";
import { useExercises } from "@sendtally/features/statistics";
import {
  afterKey,
  climbRows,
  heldSeconds,
  setKey,
  useSetsPlayer,
  type SetAt,
  type WorkoutRun,
  checklistLine,
  gripTimerLabel,
  supersetMembers,
  supersetRoundsTitle,
  type RunGroup,
} from "@sendtally/features/workouts";
import { type MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { useExerciseTallyStorage, useLiveRunStore } from "../../lib/useLiveRun";
import { GymSheet } from "../../live-session/components/GymSheet";
import { LiveClimbEditor } from "../../live-session/components/LiveClimbEditor";
import { ClimbCard } from "../climbing/ClimbCard";
import { LapsCard } from "../climbing/LapsCard";
import { useWorkoutTally } from "../climbing/useWorkoutTally";
import { ChecklistCard } from "../components/ChecklistCard";
import { onControl } from "../components/SetRow";
import { SET_COLUMNS } from "../components/setColumns";
import { SessionTargetContext } from "../components/sessionTarget";
import { exerciseHistoryPath } from "../components/exerciseHistory";
import { useLibrary, workoutIn } from "../library/useLibrary";
import { SupersetCard } from "./SupersetCard";
import { FoldedSetsCard } from "./FoldedSetsCard";
import { HoldButton } from "./HoldButton";
import { HoldRow } from "./HoldRow";
import { PlayerFrame } from "./PlayerFrame";
import { RestPreview } from "./RestPreview";
import { RestRow } from "./RestRow";
import { SetsCard, type GripCardProps } from "./SetsCard";
import { useFinishRun } from "./useFinishRun";

/**
 * A workout as a set table on a clock from Start: tick each set as it is done, rest in line
 * after it, then log what was done. A climbing exercise's sets take their climbs in the row, a
 * grade then Attempt or Sent, on the workout's tally; its climbs come back as its sets.
 */
export function SetsPage({ run, end }: { run: WorkoutRun; end: boolean }): React.ReactElement {
  const navigate = useNavigate();
  const api = useAppApi();
  const { model } = useHangData();
  const unit = model.settings.units;
  const activities = useActivities(api).state;
  const exercises = useExercises(api).state;
  const mine = exercises.status === "ready" ? exercises.data : null;
  const tally = useLiveSession(useExerciseTallyStorage());
  const grips = useGrips(api);
  const toast = useToast();
  const player = useSetsPlayer({
    isGrip: grips.isGrip,
    run,
    store: useLiveRunStore(),
    tally,
    activities: activities.status === "ready" ? activities.data : null,
    exercises: mine,
    gripSetup: (g) => model.setup(g.workout, g.workout.grip, g.dose),
  });
  const { shown, ticked, rest, hold, nameOf, items, order, part, selected } = player;
  const workout = workoutIn(useLibrary())(run.workoutId);
  const unselect = React.useRef(() => {});
  React.useEffect(() => {
    unselect.current = () => {
      if (selected !== null) player.select(selected);
    };
  });
  React.useEffect(() => {
    if (selected === null) return;
    const onClick = (e: MouseEvent): void => {
      if (e.target instanceof Element && !onControl(e.target) && !e.target.closest(".set-item"))
        unselect.current();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [selected]);
  const climbs = useWorkoutTally(tally, rest);
  const draft = climbs.draft;
  const climbing = items.some((_, i) => player.tallyOf(i) !== null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [pickingGym, setPickingGym] = React.useState(false);
  const editingClimb = draft?.climbs.find((c) => c.key === editing) ?? null;
  const [removing, setRemoving] = React.useState<number | null>(null);
  const gripOf = (i: number): GripCardProps | undefined => {
    const k = part?.places.indexOf(i) ?? -1;
    const planned = part?.planned.items[k];
    if (part === null || planned === undefined) return undefined;
    const setup = part.setup(i) ?? model.setup(planned.workout, planned.workout.grip, planned.dose);
    const timer = part.timer(i);
    return {
      name: grips.gripName(planned.workout.grip),
      edgeMm: setup.edgeMm,
      loadKg: setup.loadKg,
      timer:
        timer === null
          ? null
          : {
              label: gripTimerLabel(timer),
              onPress: () => {
                if (!timer.resume) rest.skip();
                void navigate(
                  `/app/workout/timer?${new URLSearchParams({
                    workoutId: run.workoutId,
                    gripId: planned.workout.grip,
                    part: "1",
                    ...(!timer.resume && { item: String(i), set: String(timer.set) }),
                  })}`
                );
              },
            },
    };
  };
  const titleOf = (i: number): string => gripOf(i)?.name ?? nameOf(i);
  const removeSet = (at: SetAt): void => {
    player.removeSet(at);
    toast.show({
      message: `${supersetMembers(
        (player.groups.find((g) => g.members.includes(at.item))?.members ?? [at.item]).map((m) =>
          nameOf(m)
        )
      )} · ${t("activities.setRemoved", { n: at.set + 1 })}`,
      action: { label: t("tally.undo"), onPress: player.undoRemove },
    });
  };
  // A superset's menu works on one member: the one left after it goes plays as a plain exercise.
  const groupMenu = (g: RunGroup): MoreMenuItem[] => [
    ...(player.canMove(g.members[0] ?? -1, -1)
      ? [{ label: t("workouts.moveUpShort"), onSelect: () => player.move(g.members[0] ?? -1, -1) }]
      : []),
    ...(player.canMove(g.members[0] ?? -1, 1)
      ? [{ label: t("workouts.moveDownShort"), onSelect: () => player.move(g.members[0] ?? -1, 1) }]
      : []),
    ...g.members.map((m) => ({
      label: t("workouts.skipMemberForNow", { name: nameOf(m) }),
      onSelect: () => player.skip(m),
    })),
    ...g.members.map((m) => ({
      label: t("workouts.removeExercise", { name: nameOf(m) }),
      destructive: true,
      onSelect: () => setRemoving(m),
    })),
  ];
  const menu = (i: number): MoreMenuItem[] => [
    { label: t("workouts.skipForNow"), onSelect: () => player.skip(i) },
    ...(player.canMove(i, -1)
      ? [{ label: t("workouts.moveUpShort"), onSelect: () => player.move(i, -1) }]
      : []),
    ...(player.canMove(i, 1)
      ? [{ label: t("workouts.moveDownShort"), onSelect: () => player.move(i, 1) }]
      : []),
    { label: t("workouts.removeShort"), destructive: true, onSelect: () => setRemoving(i) },
  ];
  const finish = useFinishRun(
    run,
    player.finished,
    player.startedAt,
    end,
    exercises.status !== "loading" && activities.status !== "loading"
  );

  const holdRow = (at: SetAt): React.ReactNode =>
    hold.hold?.at === setKey(at) && (
      <HoldRow
        hold={hold.hold}
        now={hold.now}
        lead={<span className={SET_COLUMNS.position}>{formatNumber(at.set + 1)}</span>}
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

  return (
    <SessionTargetContext.Provider value={workout?.targetRpe ?? null}>
      <PlayerFrame
        run={run}
        startedAt={player.startedAt}
        position={player.position}
        gym={climbing ? { name: climbs.gym?.name, onPick: () => setPickingGym(true) } : undefined}
        footer={
          <button type="button" className="detail-primary" onClick={finish}>
            {t("activities.finish")}
          </button>
        }
      >
        {order.map((i, at) => {
          const item = items[i];
          const d = shown.find((x) => x.item === i);
          if (item === undefined || d === undefined) return null;
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
                    selected={selected}
                    unit={unit}
                    onChange={(a, value) => player.change(a.item, a.set, value)}
                    onToggle={player.toggle}
                    holdRow={holdRow}
                    go={go}
                    restUnder={(a) => restAt(setKey(a))}
                    onSelect={player.select}
                    onRemoveSet={removeSet}
                    onAddRound={() => player.addSet(i)}
                    onFold={() => g.members.forEach((m) => player.fold(m))}
                    menu={groupMenu(g)}
                    history={(m) => exerciseHistoryPath(mine, items[m]?.exercise ?? "")}
                  />
                )}
                {order.indexOf(last) < order.length - 1 &&
                  (restAt(afterKey(last)) || (
                    <RestPreview seconds={restAfterItem(items, last, run.exerciseRestS)} />
                  ))}
              </React.Fragment>
            );
          }
          const climbItem = player.climbing(i);
          const skipped = player.skipped(i);
          const grip = gripOf(i);
          const between =
            at < order.length - 1 &&
            (restAt(afterKey(i)) || (
              <RestPreview seconds={restAfterItem(items, i, run.exerciseRestS)} />
            ));
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
                        : checklistLine(lines.filter((_, n) => tickedLine(n)).length, lines.length)
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
              {climbItem !== null && player.folded(i) ? (
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
              ) : climbItem?.measure === "laps" ? (
                <LapsCard
                  item={i}
                  at={item}
                  planned={player.setsPlanned(i)}
                  draft={draft}
                  on={() => player.draftOn(i)}
                  live={tally}
                  rest={rest}
                  now={climbs.now}
                  unit={unit}
                  about={exerciseAbout(mine, item.exercise, nameOf(i))}
                  history={exerciseHistoryPath(mine, item.exercise)}
                  onFold={() => player.fold(i)}
                  menu={menu(i)}
                  onLapRemoved={(lap) =>
                    toast.show({
                      message: `${nameOf(i)} · ${t("tally.lapRemoved", { lap })}`,
                      action: { label: t("tally.undo"), onPress: () => player.lapBack(i) },
                    })
                  }
                />
              ) : climbItem !== null ? (
                <ClimbCard
                  item={item}
                  plan={player.climbPlan(i)}
                  rows={climbRows(draft, i, player.climbPlan(i))}
                  unit={unit}
                  tally={climbs}
                  picking={player.climbAt === i}
                  onPress={() => player.climbOn(i)}
                  onPressSet={(set) => player.pressSet(i, set)}
                  onAddSet={() => player.addSet(i)}
                  onRemoved={(c, grade) =>
                    toast.show({
                      message: `${nameOf(i)} · ${t("tally.climbRemoved", { grade })}`,
                      action: { label: t("tally.undo"), onPress: player.climbRemoved(c) },
                    })
                  }
                  restUnder={(set) => restAt(setKey({ item: i, set }))}
                  about={exerciseAbout(mine, item.exercise, nameOf(i))}
                  history={exerciseHistoryPath(mine, item.exercise)}
                  onFold={() => player.fold(i)}
                  menu={menu(i)}
                  onEdit={setEditing}
                />
              ) : player.folded(i) ? (
                <FoldedSetsCard
                  name={titleOf(i)}
                  line={
                    skipped
                      ? t("plan.skipped")
                      : foldedLine(d.sets, unit, grip ? "hangboard" : "strength")
                  }
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
                  selected={selected}
                  unit={unit}
                  onChange={(set, value) => player.change(i, set, value)}
                  onToggle={(set) => player.toggle({ item: i, set })}
                  holdRow={(set) => holdRow({ item: i, set })}
                  go={(set) => go({ item: i, set })}
                  restUnder={(set) => restAt(setKey({ item: i, set }))}
                  about={exerciseAbout(mine, item.exercise, nameOf(i))}
                  {...(grip === undefined
                    ? { history: exerciseHistoryPath(mine, item.exercise) }
                    : { grip, history: `/app/train/grip/${item.exercise}` })}
                  onSelect={(set) => player.select({ item: i, set })}
                  onRemoveSet={(set) => removeSet({ item: i, set })}
                  onAddSet={() => player.addSet(i)}
                  onFold={() => player.fold(i)}
                  menu={menu(i)}
                />
              )}
              {between}
            </React.Fragment>
          );
        })}
        <Sheet
          open={removing !== null}
          title={t("workouts.removeExercise", { name: removing === null ? "" : nameOf(removing) })}
          onClose={() => setRemoving(null)}
          action={{
            label: t("workouts.removeShort"),
            danger: true,
            onPress: () => {
              if (removing !== null) player.remove(removing);
              setRemoving(null);
            },
          }}
        >
          <p className="sheet-body">{t("workouts.removeFromRunBody")}</p>
        </Sheet>
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
            open={pickingGym}
            gyms={climbs.gyms}
            gymId={draft?.gymId}
            onPick={(gymId) => {
              climbs.pickGym(gymId);
              setPickingGym(false);
            }}
            onClose={() => setPickingGym(false)}
          />
        )}
      </PlayerFrame>
    </SessionTargetContext.Provider>
  );
}

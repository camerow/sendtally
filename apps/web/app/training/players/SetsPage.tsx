import React from "react";
import { useNavigate } from "react-router";
import { restAfterItem } from "@sendtally/core/hang";
import {
  climbingDoseLine,
  foldedLine,
  useActivities,
  useWeightUnit,
} from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { useLiveSession, withLapBack } from "@sendtally/features/log-session";
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
  runItems,
} from "@sendtally/features/workouts";
import { type MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { ExercisePicker } from "../editor/ExercisePicker";
import { useExerciseTallyStorage, useLiveRunStore } from "../../lib/useLiveRun";
import { GymSheet } from "../../live-session/components/GymSheet";
import { LiveClimbEditor } from "../../live-session/components/LiveClimbEditor";
import { ClimbCard } from "../climbing/ClimbCard";
import { LapsCard } from "../climbing/LapsCard";
import { useWorkoutTally } from "../climbing/useWorkoutTally";
import { FingersCard } from "./FingersCard";
import { ChecklistCard } from "./ChecklistCard";
import { FoldedSetsCard } from "./FoldedSetsCard";
import { HoldButton } from "./HoldButton";
import { HoldRow } from "./HoldRow";
import { PlayerFrame } from "./PlayerFrame";
import { RestPreview } from "./RestPreview";
import { RestRow } from "./RestRow";
import { SetsCard } from "./SetsCard";
import { useFinishRun } from "./useFinishRun";

/**
 * A workout as a set table on a clock from Start: tick each set as it is done, rest in line
 * after it, then log what was done. A climbing exercise's sets take their climbs in the row, a
 * grade then Attempt or Sent, on the workout's tally; its climbs come back as its sets.
 */
export function SetsPage({ run, end }: { run: WorkoutRun; end: boolean }): React.ReactElement {
  const navigate = useNavigate();
  const api = useAppApi();
  const unit = useWeightUnit(api);
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
  });
  const { shown, ticked, current, rest, hold, previous, nameOf, items, order, part } = player;
  const climbs = useWorkoutTally(tally, rest);
  const draft = climbs.draft;
  const climbing = items.some((_, i) => player.tallyOf(i) !== null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [pickingGym, setPickingGym] = React.useState(false);
  const editingClimb = draft?.climbs.find((c) => c.key === editing) ?? null;
  const undo = React.useRef(climbs.undo);
  const lapBack = React.useRef((_item: number) => {});
  React.useEffect(() => {
    undo.current = climbs.undo;
    lapBack.current = (item) => {
      if (draft !== null) tally.replace(withLapBack(draft, item));
    };
  });
  const snack = climbs.snack;
  React.useEffect(() => {
    if (snack !== null)
      toast.show({
        message: snack.message,
        action: { label: t("tally.undo"), onPress: () => undo.current() },
      });
  }, [snack, toast]);
  const [picking, setPicking] = React.useState(false);
  const [removing, setRemoving] = React.useState<number | null>(null);
  const removeSet = (at: SetAt): void => {
    player.removeSet(at);
    toast.show({
      message: `${nameOf(at.item)} · ${t("activities.setRemoved", { n: at.set + 1 })}`,
      action: { label: t("tally.undo"), onPress: player.undoRemove },
    });
  };
  const menu = (i: number, at: number): MoreMenuItem[] => [
    ...(player.canClimbOn(i)
      ? [{ label: t("workouts.climbNow"), onSelect: () => player.climbOn(i) }]
      : []),
    { label: t("workouts.skipForNow"), onSelect: () => player.skip(i) },
    ...(at > 0 ? [{ label: t("workouts.moveUpShort"), onSelect: () => player.move(i, -1) }] : []),
    ...(at < order.length - 1
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
        lead={<span className="set-col-n">{formatNumber(at.set + 1)}</span>}
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

  return (
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
        if (part !== null && part.places.includes(i)) {
          const last = part.places[part.places.length - 1] ?? i;
          return (
            i === part.places[0] && (
              <React.Fragment key={i}>
                <FingersCard
                  part={part}
                  unit={unit}
                  gripName={grips.gripName}
                  onStart={() =>
                    void navigate(
                      `/app/workout/timer?${new URLSearchParams({ workoutId: run.workoutId, part: "1" })}`
                    )
                  }
                  onRemoved={(message, undo) =>
                    toast.show({ message, action: { label: t("tally.undo"), onPress: undo } })
                  }
                />
                {at < order.length - 1 &&
                  (restAt(afterKey(last)) || (
                    <RestPreview seconds={restAfterItem(items, last, run.exerciseRestS)} />
                  ))}
              </React.Fragment>
            )
          );
        }
        const climbItem = player.climbing(i);
        const skipped = player.skipped(i);
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
                      ? t("workouts.skippedTapToDo")
                      : checklistLine(lines.filter((_, n) => tickedLine(n)).length, lines.length)
                  }
                  done={!skipped && lines.every((_, n) => tickedLine(n))}
                  onOpen={() => player.open(i)}
                />
              ) : (
                <ChecklistCard
                  item={item}
                  lines={lines}
                  ticked={tickedLine}
                  onToggle={(set) => player.toggle({ item: i, set })}
                  onFold={() => player.fold(i)}
                  menu={menu(i, at)}
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
                    ? t("workouts.skippedTapToDo")
                    : (climbItem.logged ?? climbingDoseLine(item.dose, climbItem.measure))
                }
                done={!skipped && climbItem.logged !== null}
                onOpen={() => player.open(i)}
              />
            ) : climbItem?.measure === "laps" ? (
              <LapsCard
                item={i}
                at={item}
                logged={player.climbedSets(i)}
                planned={player.lapsPlanned(i)}
                draft={draft}
                live={tally}
                rest={rest}
                now={climbs.now}
                about={exerciseAbout(mine, item.exercise, nameOf(i))}
                onFold={() => player.fold(i)}
                menu={menu(i, at)}
                onLapRemoved={(lap) =>
                  toast.show({
                    message: `${nameOf(i)} · ${t("tally.lapRemoved", { lap })}`,
                    action: { label: t("tally.undo"), onPress: () => lapBack.current(i) },
                  })
                }
              />
            ) : climbItem !== null ? (
              <ClimbCard
                item={item}
                plan={player.climbPlan(i)}
                rows={climbRows(draft, i, player.climbPlan(i), climbs.now)}
                tally={player.climbAt === i ? climbs : null}
                restUnder={(set) => restAt(setKey({ item: i, set }))}
                about={exerciseAbout(mine, item.exercise, nameOf(i))}
                onFold={() => player.fold(i)}
                menu={menu(i, at)}
                onFlip={climbs.flip}
                onEdit={setEditing}
              />
            ) : player.folded(i) ? (
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
                onRemoveSet={(set) => removeSet({ item: i, set })}
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
        <button
          type="button"
          className="outline-button player-add-exercise"
          onClick={() => setPicking(true)}
        >
          + {t("workouts.addExercise")}
        </button>
      )}
      {picking && (
        <ExercisePicker
          items={runItems(items)}
          multi
          onPick={(picked) => picked.forEach(player.addExercise)}
          onClose={() => setPicking(false)}
        />
      )}
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
  );
}

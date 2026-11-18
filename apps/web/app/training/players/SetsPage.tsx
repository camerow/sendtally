import React from "react";
import { restAfterItem } from "@sendtally/core/hang";
import { useNavigate } from "react-router";
import { foldedLine, useActivities, useWeightUnit } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { useLiveSession } from "@sendtally/features/log-session";
import { exerciseAbout } from "@sendtally/features/exercises";
import { useGrips } from "@sendtally/features/hang";
import { useExercises } from "@sendtally/features/statistics";
import {
  afterKey,
  heldSeconds,
  setKey,
  useSetsPlayer,
  type SetAt,
  type WorkoutRun,
} from "@sendtally/features/workouts";
import { type MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { ExercisePicker } from "../editor/ExercisePicker";
import { useExerciseTallyStorage, useLiveRunStore } from "../../lib/useLiveRun";
import { ClimbingCard } from "./ClimbingCard";
import { FingersCard } from "./FingersCard";
import { FoldedSetsCard } from "./FoldedSetsCard";
import { HoldButton } from "./HoldButton";
import { HoldRow } from "./HoldRow";
import { PlayerFrame } from "./PlayerFrame";
import { RestPreview } from "./RestPreview";
import { RestRow } from "./RestRow";
import { SetsCard } from "./SetsCard";
import { useFinishRun } from "./useFinishRun";

/**
 * A lifting workout as a set table on a clock from Start: tick each set as it is done, rest
 * in line after it, then log what was done. A climbing exercise is a card instead, whose Start
 * logs it on the workout tally; its climbs come back as its sets.
 */
export function SetsPage({ run, end }: { run: WorkoutRun; end: boolean }): React.ReactElement {
  const api = useAppApi();
  const navigate = useNavigate();
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
        const climbing = player.climbing(i);
        const skipped = player.skipped(i);
        const between =
          at < order.length - 1 &&
          (restAt(afterKey(i)) || (
            <RestPreview seconds={restAfterItem(items, i, run.exerciseRestS)} />
          ));
        return (
          <React.Fragment key={i}>
            {climbing !== null ? (
              <ClimbingCard
                item={item}
                {...climbing}
                onStart={() => {
                  player.startClimbing(i, climbing.measure);
                  void navigate("/app/workout/tally");
                }}
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
          items={items.map((x) => ({ exercise: x.exercise, doses: [x.dose] }))}
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
    </PlayerFrame>
  );
}

import { randomUUID } from "expo-crypto";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import {
  doneAsPrescribed,
  percentOf,
  protocolDose,
  protocolOf,
  type HangSetup,
  type SessionItem,
  type SetDone,
} from "@sendtally/core/hang";
import { keptSets, type ActivityDraft } from "@sendtally/features/activities";
import { today as dayOf } from "@sendtally/features/journal";
import { ActivityForm } from "../activity/ActivityForm";
import { useHangData } from "../data/HangDataContext";
import { SetupFields } from "../setup/SetupFields";
import { usePlannedRun, type PlannedRun } from "../timer/usePlannedRun";
import { openStats } from "../../stats/statsSegment";
import type { DoneParams } from "./doneParams";

/** Seconds on the edge, or lifts, that sets hold. */
const workOf = (sets: readonly SetDone[]): number =>
  sets.reduce((n, s) => n + (s.reps ?? 1) * (s.onS ?? 1), 0);

function Review({
  planned,
  params,
}: {
  planned: PlannedRun;
  params: DoneParams;
}): React.ReactElement {
  const { model, actions, today } = useHangData();
  const [id] = React.useState(randomUUID);
  const { items } = planned;
  const workout = items[0].workout;
  const grips = items.map((i, k) => (k === 0 ? params.gripId : i.workout.grip));
  const prescribed: SessionItem[] = items.map((i, k) => ({
    exercise: grips[k] ?? i.workout.grip,
    dose: protocolDose(i.workout),
  }));
  const { run } = params;
  const [setups] = React.useState<HangSetup[]>(
    () => run?.setups ?? items.map((i, k) => model.setup(i.workout, grips[k] ?? "", i.dose))
  );
  const [setup, setSetup] = React.useState(setups[0] ?? { edgeMm: 0, loadKg: 0 });
  const [initial] = React.useState<ActivityDraft>(() => ({
    kind: "other",
    title: workout.name,
    date: run === null ? today : dayOf(new Date(run.startedAt)),
    startTime: "",
    minutes: 0,
    rpe: null,
    notes: "",
    workoutId: workout.id,
    ...params.link,
    done: (run?.done ?? doneAsPrescribed(prescribed)).map((d) => ({
      ...d,
      exercise: model.gripName(grips[d.item] ?? d.exercise),
    })),
    off: run?.off ?? [],
  }));

  const save = (draft: ActivityDraft): void => {
    const kept = keptSets(draft.done, draft.off);
    const misses = kept.reduce(
      (n, d) =>
        n +
        d.sets.reduce(
          (m, s) => m + Math.max(0, (prescribed[d.item]?.dose.reps ?? 1) - (s.reps ?? 1)),
          0
        ),
      0
    );
    const plannedWork = prescribed.reduce(
      (n, p) => n + workOf(Array.from({ length: p.dose.sets }, () => p.dose)),
      0
    );
    void actions.saveSession({
      id,
      workoutId: workout.id,
      gripId: params.gripId,
      date: draft.date,
      ...setup,
      pct: percentOf(
        kept.reduce((n, d) => n + workOf(d.sets), 0),
        plannedWork
      ),
      misses,
      rpe: draft.rpe,
      protocol: protocolOf(workout),
      membershipId: draft.membershipId,
      week: draft.week,
      focus: draft.focus,
      done: kept.map((d) => {
        const at = d.item === 0 ? setup : (setups[d.item] ?? setup);
        const hang = items[d.item]?.workout.kind === "hang";
        return {
          item: d.item,
          exercise: grips[d.item] ?? d.exercise,
          sets: d.sets.map((s) => ({
            ...s,
            ...(hang ? { edgeMm: at.edgeMm } : {}),
            weightKg: at.loadKg,
          })),
        };
      }),
    });
    openStats("training");
  };

  return (
    <ActivityForm
      id={id}
      initial={initial}
      logged={null}
      timed
      kindSet
      live={run !== null}
      planned={prescribed}
      hang={{
        setup: <SetupFields kind={workout.kind} setup={setup} onChange={setSetup} />,
        save,
      }}
    />
  );
}

/** A hangboard workout's review: what the timer saw, or every set as planned when logged without it. */
export function DoneScreen({ params }: { params: DoneParams }): React.ReactElement | null {
  const planned = usePlannedRun(params.workoutId, params.link, params.session);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {planned !== undefined && <Review planned={planned} params={params} />}
    </SafeAreaView>
  );
}

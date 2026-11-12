import { randomUUID } from "expo-crypto";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import {
  doneAsPrescribed,
  protocolDose,
  protocolOf,
  type HangSetup,
  type SessionItem,
} from "@sendtally/core/hang";
import { keptSets, type ActivityDraft } from "@sendtally/features/activities";
import { hangResult } from "@sendtally/features/hang";
import { today as dayOf } from "@sendtally/features/journal";
import { ActivityForm } from "../activity/ActivityForm";
import { useHangData } from "../data/HangDataContext";
import { SetupPill } from "./SetupPill";
import { usePlannedRun, type PlannedRun } from "../timer/usePlannedRun";
import { openStats } from "../../stats/statsSegment";
import type { DoneParams } from "@sendtally/features/workouts";

const clockOf = (d: Date): string =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

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
    // Read on the review only: a hang session saves no clock time.
    startTime: run === null ? "" : clockOf(new Date(run.startedAt)),
    minutes: run === null ? 0 : Math.max(1, Math.round((Date.now() - run.startedAt) / 60_000)),
    rpe: null,
    notes: "",
    workoutId: workout.id,
    ...params.link,
    // A first-grip set at the session's load follows the pill; one the timer ran heavier or lighter keeps its own.
    done: (run?.done ?? doneAsPrescribed(prescribed)).map((d) => ({
      ...d,
      exercise: model.gripName(grips[d.item] ?? d.exercise),
      sets: d.sets.map(({ weightKg, ...s }) =>
        d.item === 0 && (weightKg === undefined || weightKg === setup.loadKg)
          ? s
          : { ...s, weightKg: weightKg ?? (setups[d.item] ?? setup).loadKg }
      ),
    })),
    off: run?.off ?? [],
  }));

  const save = (draft: ActivityDraft): void => {
    const result = hangResult(keptSets(draft.done, draft.off), prescribed, (d) => ({
      exercise: grips[d.item] ?? d.exercise,
      setup: d.item === 0 ? setup : (setups[d.item] ?? setup),
      hang: items[d.item]?.workout.kind === "hang",
    }));
    void actions.saveSession({
      id,
      workoutId: workout.id,
      gripId: params.gripId,
      date: draft.date,
      ...setup,
      pct: result.pct,
      misses: result.misses,
      rpe: draft.rpe,
      protocol: protocolOf(workout),
      membershipId: draft.membershipId,
      week: draft.week,
      focus: draft.focus,
      done: result.done,
    });
    openStats("training");
  };

  return (
    <ActivityForm
      id={id}
      initial={initial}
      logged={null}
      timed={run !== null}
      kindSet
      live={run !== null}
      planned={prescribed}
      hang={{
        setup: (
          <SetupPill
            kind={workout.kind}
            setup={setup}
            kicker={model.gripName(params.gripId)}
            onChange={setSetup}
          />
        ),
        loadKg: setup.loadKg,
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

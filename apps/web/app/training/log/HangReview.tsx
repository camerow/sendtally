import React from "react";
import { useNavigate } from "react-router";
import {
  doneAsPrescribed,
  protocolDose,
  protocolOf,
  type HangSetup,
  type SessionItem,
} from "@sendtally/core/hang";
import { keptSets, type ActivityDraft } from "@sendtally/features/activities";
import { hangResult } from "@sendtally/features/hang";
import { usePlannedRun, type DoneParams, type PlannedRun } from "@sendtally/features/workouts";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { ActivityForm } from "./ActivityForm";
import { activityPath } from "./paths";
import { SetupPill } from "./SetupPill";

function Review({
  planned,
  params,
}: {
  planned: PlannedRun;
  params: DoneParams;
}): React.ReactElement {
  const navigate = useNavigate();
  const { model, actions, today } = useHangData();
  const [id] = React.useState(() => crypto.randomUUID());
  const { items } = planned;
  const workout = items[0].workout;
  const grips = items.map((i, k) => (k === 0 ? params.gripId : i.workout.grip));
  const prescribed: SessionItem[] = items.map((i, k) => ({
    exercise: grips[k] ?? i.workout.grip,
    dose: protocolDose(i.workout),
  }));
  const [setups] = React.useState<HangSetup[]>(() =>
    items.map((i, k) => model.setup(i.workout, grips[k] ?? "", i.dose))
  );
  const [setup, setSetup] = React.useState(setups[0] ?? { edgeMm: 0, loadKg: 0 });
  const [initial] = React.useState<ActivityDraft>(() => ({
    kind: "other",
    title: workout.name,
    date: today,
    startTime: "",
    minutes: 0,
    rpe: null,
    notes: "",
    workoutId: workout.id,
    ...params.link,
    done: doneAsPrescribed(prescribed).map((d) => ({
      ...d,
      exercise: model.gripName(grips[d.item] ?? d.exercise),
      sets: d.sets.map(({ weightKg, ...s }) =>
        d.item === 0 && (weightKg === undefined || weightKg === setup.loadKg)
          ? s
          : { ...s, weightKg: weightKg ?? (setups[d.item] ?? setup).loadKg }
      ),
    })),
    off: [],
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
    void navigate(activityPath(id), { replace: true });
  };

  return (
    <ActivityForm
      id={id}
      initial={initial}
      logged={null}
      kindSet
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

/** A hangboard workout logged without the timer: every set as planned, to review and save. */
export function HangReview({ params }: { params: DoneParams }): React.ReactElement | null {
  const { model } = useHangData();
  const planned = usePlannedRun(useAppApi(), model, params.workoutId, params.link, params.session);
  return planned === undefined ? null : <Review planned={planned} params={params} />;
}

import React from "react";
import { useNavigate } from "react-router";
import type { ActivityDraft } from "@sendtally/features/activities";
import {
  hangReview,
  hangReviewDraft,
  hangSessionOf,
  usePlannedRun,
  type DoneParams,
  type PlannedRun,
} from "@sendtally/features/workouts";
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
  const [review] = React.useState(() => hangReview(params, planned, model));
  const [setup, setSetup] = React.useState(review.setups[0] ?? { edgeMm: 0, loadKg: 0 });
  const [initial] = React.useState<ActivityDraft>(() =>
    hangReviewDraft(review, setup, model, today, Date.now())
  );
  const workout = planned.items[0].workout;

  const save = (draft: ActivityDraft): void => {
    void actions.saveSession(hangSessionOf(review, setup, draft, id));
    void navigate(activityPath(id), { replace: true });
  };

  return (
    <ActivityForm
      id={id}
      initial={initial}
      logged={null}
      kindSet
      planned={review.prescribed}
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
export function HangReview({ params }: { params: DoneParams }): React.ReactElement | null {
  const { model } = useHangData();
  const planned = usePlannedRun(useAppApi(), model, params.workoutId, params.link, params.session);
  return planned === undefined ? null : <Review planned={planned} params={params} />;
}

import { randomUUID } from "expo-crypto";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import type { ActivityDraft } from "@sendtally/features/activities";
import { ActivityForm } from "../activity/ActivityForm";
import { useHangData } from "../data/HangDataContext";
import { SetupPill } from "./SetupPill";
import { usePlannedRun, type PlannedRun } from "../timer/usePlannedRun";
import { openStats } from "../../stats/statsSegment";
import {
  hangReview,
  hangReviewDraft,
  hangSessionOf,
  type DoneParams,
} from "@sendtally/features/workouts";

function Review({
  planned,
  params,
}: {
  planned: PlannedRun;
  params: DoneParams;
}): React.ReactElement {
  const { model, actions, today } = useHangData();
  const [id] = React.useState(randomUUID);
  const [review] = React.useState(() => hangReview(params, planned, model));
  const [setup, setSetup] = React.useState(review.setups[0] ?? { edgeMm: 0, loadKg: 0 });
  const [initial] = React.useState<ActivityDraft>(() =>
    hangReviewDraft(review, setup, model, today, Date.now())
  );
  const workout = planned.items[0].workout;
  const { run } = params;

  const save = (draft: ActivityDraft): void => {
    void actions.saveSession(hangSessionOf(review, setup, draft, id));
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
export function DoneScreen({ params }: { params: DoneParams }): React.ReactElement | null {
  const planned = usePlannedRun(params.workoutId, params.link, params.session);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {planned !== undefined && <Review planned={planned} params={params} />}
    </SafeAreaView>
  );
}

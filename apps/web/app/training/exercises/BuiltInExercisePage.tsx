import React from "react";
import { libraryPictures } from "@sendtally/features/library";
import { kindLabel } from "@sendtally/features/activities";
import type { BuiltInExercise } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { workoutsUsing } from "@sendtally/features/statistics";
import { MoreMenu } from "../../components/MoreMenu";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { CategoryMark } from "../components/CategoryMark";
import { DashedPanel } from "../components/DashedPanel";
import { Description } from "../components/Description";
import { UsedIn } from "../components/UsedIn";
import { useLibrary } from "../library/useLibrary";
import { usePick } from "../editor/useMake";
import { useAddToWorkout } from "../editor/useAddToWorkout";
import { EXERCISES_VIEW } from "./paths";
import { useExerciseInPlan } from "./useExerciseInPlan";

/** A built-in the user has not made their own: nothing logged yet, and adding it anywhere makes it theirs. */
export function BuiltInExercisePage({ builtIn }: { builtIn: BuiltInExercise }): React.ReactElement {
  const pick = usePick();
  const library = useLibrary().state;
  const usedIn =
    library.status === "ready" ? workoutsUsing(library.data.workouts, builtIn.name) : [];
  const addTo = useAddToWorkout({
    name: builtIn.name,
    pick: () => pick({ builtIn }),
    fingers: false,
    usedIn,
  });
  const inPlan = useExerciseInPlan({ kind: builtIn.kind, name: builtIn.name, source: { builtIn } });
  const items = [...[addTo.item, inPlan.block.item].filter((i) => i !== null), inPlan.schedule];
  return (
    <DetailFrame
      backTo={EXERCISES_VIEW}
      hero={libraryPictures("exercise", builtIn.id)}
      action={
        <span className="detail-actions">
          <MoreMenu label={t("summary.more")} items={items} />
        </span>
      }
    >
      <div className="intro">
        <span className="intro-kicker">
          <CategoryMark kind={builtIn.kind} size={28} />
          <span className="train-label">{kindLabel(builtIn.kind)}</span>
        </span>
        <h1 className="train-title intro-title">{builtIn.name}</h1>
        <Description text={builtIn.description} fold />
      </div>
      <DashedPanel body={t("workouts.exerciseNothingLogged")} />
      <UsedIn workouts={usedIn} />
      {addTo.sheet}
      {inPlan.block.sheet}
    </DetailFrame>
  );
}

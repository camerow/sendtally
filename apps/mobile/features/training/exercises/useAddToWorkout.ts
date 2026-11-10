import { router } from "expo-router";
import { Alert } from "react-native";
import { t } from "@sendtally/features/i18n";
import { draftOf, useWorkoutActions } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { useAddToMenu, type AddToMenu } from "../components/useAddToMenu";
import type { Picked } from "../exercise-picker/types";
import { useLibrary } from "../library/useLibrary";
import { withEditorIds, withItemsAdded } from "../workout-editor/editorState";

const failed = (): void => Alert.alert(t("workouts.saveFailed"));

export type AddToWorkoutArgs = {
  name: string;
  picked: Picked;
  /** A Fingers exercise goes in Fingers workouts, any other in the rest. */
  fingers: boolean;
  /** The workouts already using it. */
  usedIn: readonly { id: string }[];
};

/** An exercise's Add to workout: any of the user's own workouts it fits, at the end. */
export function useAddToWorkout({ name, picked, fingers, usedIn }: AddToWorkoutArgs): AddToMenu {
  const library = useLibrary().state;
  const actions = useWorkoutActions(useApi(), failed);
  const workouts =
    library.status === "ready"
      ? library.data.workouts.filter(
          (w) => w.source === "mine" && (w.kind === "hangboard") === fingers
        )
      : [];
  return useAddToMenu({
    title: t("workouts.addToWorkout"),
    name,
    options: workouts.map((w) => ({
      id: w.id,
      label: w.name,
      there: usedIn.some((u) => u.id === w.id),
    })),
    add: (id) => {
      const w = workouts.find((x) => x.id === id);
      if (w !== undefined)
        void actions.saveWorkout(id, withItemsAdded(withEditorIds(draftOf(w)), [picked]));
    },
    view: (id) => router.push({ pathname: "/workout/[id]", params: { id } }),
  });
}

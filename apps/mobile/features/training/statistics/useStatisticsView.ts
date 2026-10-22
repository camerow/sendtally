import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import type { StatisticsParams, StatisticsView } from "./types";

export type StatisticsViewState = {
  view: StatisticsView;
  setView: (view: StatisticsView) => void;
  workoutId?: string;
  gripId?: string;
};

type Hang = { workoutId?: string; gripId?: string };

/** The chosen view, taking over whatever a link asked for and clearing it so the next link lands too. */
export function useStatisticsView(): StatisticsViewState {
  const params = useLocalSearchParams<StatisticsParams>();
  const [view, setView] = React.useState<StatisticsView>("overview");
  const [hang, setHang] = React.useState<Hang>({});
  const asked =
    params.view === undefined ? null : [params.view, params.workout, params.grip].join(":");
  const [seen, setSeen] = React.useState<string | null>(null);
  if (asked !== seen) {
    setSeen(asked);
    if (params.view !== undefined) {
      setView(params.view);
      setHang({ workoutId: params.workout, gripId: params.grip });
    }
  }
  React.useEffect(() => {
    if (asked !== null) router.setParams({ view: undefined, workout: undefined, grip: undefined });
  }, [asked]);
  return { view, setView, ...hang };
}

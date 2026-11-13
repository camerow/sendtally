import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useGyms } from "../gyms/useGyms";
import { t } from "../i18n";
import type { Discipline } from "../log-session/types";
import type { QueryState } from "../query";
import { useGradeScalePrefs } from "../settings/useGradeScales";
import type { TrendRange } from "../trends/types";
import { daysClimbed, type DaysClimbedVM } from "./daysClimbed";
import {
  climbingInsightsVM,
  mainDiscipline,
  workoutClimbSessions,
  type ClimbPlaceFilter,
  type ClimbingInsightsVM,
} from "./insights";
import { useClimbs, type ClimbsData } from "./useClimbs";

/** Where a climb was: anywhere, outside, or in a gym, as the Stats filter names it. */
export function climbPlaceLabel(place: ClimbPlaceFilter): string {
  if (place === "outdoor") return t("trends.outside");
  return place === "indoor" ? t("climbs.gym") : t("trends.scopeAll");
}

export type ClimbingInsightsFeature = {
  state: QueryState<ClimbsData>;
  /** Null until the climbs have loaded. */
  vm: ClimbingInsightsVM | null;
  days: DaysClimbedVM;
  /** The discipline shown: the one picked, else the one climbed most. */
  discipline: Discipline;
  setDiscipline: (discipline: Discipline) => void;
  place: ClimbPlaceFilter;
  setPlace: (place: ClimbPlaceFilter) => void;
};

/**
 * Stats > Climbing over a range: the climbs and the sessions that logged them, those logged in
 * workouts too, filtered by discipline and place.
 */
export function useClimbingInsights(api: SendtallyApi, range: TrendRange): ClimbingInsightsFeature {
  const { state } = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const [picked, setDiscipline] = React.useState<Discipline | null>(null);
  const [place, setPlace] = React.useState<ClimbPlaceFilter>("all");
  const gymList = useGyms(api).state;
  const gyms = React.useMemo(
    () => new Map(gymList.status === "ready" ? gymList.data.map((g) => [g.id, g.name]) : []),
    [gymList]
  );
  const ready = state.status === "ready" ? state.data : null;
  const sessions = React.useMemo(
    () => (ready === null ? [] : [...ready.sessions, ...workoutClimbSessions(ready.activities)]),
    [ready]
  );
  const discipline = picked ?? mainDiscipline(sessions);
  const vm = React.useMemo(
    () =>
      ready === null
        ? null
        : climbingInsightsVM(sessions, ready.climbs, { range, discipline, place, scales, gyms }),
    [ready, sessions, range, discipline, place, scales, gyms]
  );
  const days = React.useMemo(() => daysClimbed(sessions, range), [sessions, range]);
  return { state, vm, days, discipline, setDiscipline, place, setPlace };
}

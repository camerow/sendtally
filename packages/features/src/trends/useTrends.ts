import React from "react";
import type { Gym, SendtallyApi, SessionWithClimbs } from "@sendtally/api-client";
import { queries, useQueryPair, type QueryState } from "../query";
import { filterSessionsByTags, sessionTagOptions, type TagOption } from "../sessions/tags";
import { trendsVM } from "./transforms";
import { PREVIEW_TREND_RANGE, type Discipline, type TrendRange, type TrendsVM } from "./types";

export type TrendsOptions = {
  /** Non-member preview: pinned to the last 7 days, every other range reads as locked. */
  preview?: boolean;
};

export type TrendsFeature = {
  state: QueryState<TrendsVM>;
  preview: boolean;
  range: TrendRange;
  setRange: (range: TrendRange) => void;
  setDiscipline: (discipline: Discipline) => void;
  tagOptions: TagOption[];
  untaggedCount: number;
  selectedTags: string[];
  setTags: (slugs: string[]) => void;
  toggleTag: (slug: string) => void;
  clearTags: () => void;
  /** Gyms with circuits, offered as a place filter; picking one groups the breakdown by circuit. */
  gyms: Gym[];
  gymId: string | null;
  setGym: (gymId: string | null) => void;
};

const withCircuits = (gyms: Gym[]): Gym[] => gyms.filter((g) => g.circuits.length > 0);

export function useTrends(
  api: SendtallyApi,
  { preview = false }: TrendsOptions = {}
): TrendsFeature {
  const [chosenRange, setRange] = React.useState<TrendRange>("3m");
  const range = preview ? PREVIEW_TREND_RANGE : chosenRange;
  const [discipline, setDiscipline] = React.useState<Discipline | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [gymId, setGym] = React.useState<string | null>(null);

  const { state: raw } = useQueryPair(queries.sessionsWithClimbs(api), {
    ...queries.gyms(api),
    select: withCircuits,
  });

  const placed = React.useMemo(
    (): SessionWithClimbs[] =>
      raw.status !== "ready"
        ? []
        : gymId === null
          ? raw.data[0]
          : raw.data[0].filter((s) => s.gym_id === gymId),
    [raw, gymId]
  );

  const tagOptions = React.useMemo((): TagOption[] => sessionTagOptions(placed), [placed]);

  const untaggedCount = React.useMemo(
    (): number => placed.filter((s) => s.tags.length === 0).length,
    [placed]
  );

  const state = React.useMemo((): QueryState<TrendsVM> => {
    if (raw.status !== "ready") return raw;
    return {
      status: "ready",
      data: trendsVM(
        filterSessionsByTags(placed, selectedTags),
        range,
        new Date(),
        discipline,
        gymId === null ? "tag" : "circuit"
      ),
    };
  }, [raw, placed, range, selectedTags, discipline, gymId]);

  const toggleTag = React.useCallback((slug: string): void => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const clearTags = React.useCallback((): void => setSelectedTags([]), []);

  const setTags = React.useCallback((slugs: string[]): void => setSelectedTags(slugs), []);

  return {
    state,
    preview,
    range,
    setRange,
    setDiscipline,
    tagOptions,
    untaggedCount,
    selectedTags,
    setTags,
    toggleTag,
    clearTags,
    gyms: raw.status === "ready" ? raw.data[1] : [],
    gymId,
    setGym,
  };
}

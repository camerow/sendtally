import React from "react";
import type { SendtallyApi, SessionWithClimbs } from "@sendtally/api-client";
import { useQuery, type QueryState } from "../lib/useQuery";
import { filterSessionsByTags, sessionTagOptions, type TagOption } from "../sessions/tags";
import { trendsVM } from "./transforms";
import type { Discipline, TrendRange, TrendsVM } from "./types";

export type TrendsFeature = {
  state: QueryState<TrendsVM>;
  reload: () => void;
  range: TrendRange;
  setRange: (range: TrendRange) => void;
  setDiscipline: (discipline: Discipline) => void;
  tagOptions: TagOption[];
  untaggedCount: number;
  selectedTags: string[];
  setTags: (slugs: string[]) => void;
  toggleTag: (slug: string) => void;
  clearTags: () => void;
};

export function useTrends(api: SendtallyApi): TrendsFeature {
  const [range, setRange] = React.useState<TrendRange>("3m");
  const [discipline, setDiscipline] = React.useState<Discipline | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const load = React.useCallback(async (): Promise<SessionWithClimbs[]> => {
    const { sessions } = await api.sessionsWithClimbs();
    return sessions;
  }, [api]);

  const { state: raw, reload } = useQuery(load);

  const tagOptions = React.useMemo(
    (): TagOption[] => (raw.status === "ready" ? sessionTagOptions(raw.data) : []),
    [raw]
  );

  const untaggedCount = React.useMemo(
    (): number => (raw.status === "ready" ? raw.data.filter((s) => s.tags.length === 0).length : 0),
    [raw]
  );

  const state = React.useMemo((): QueryState<TrendsVM> => {
    if (raw.status !== "ready") return raw;
    return {
      status: "ready",
      data: trendsVM(filterSessionsByTags(raw.data, selectedTags), range, new Date(), discipline),
    };
  }, [raw, range, selectedTags, discipline]);

  const toggleTag = React.useCallback((slug: string): void => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const clearTags = React.useCallback((): void => setSelectedTags([]), []);

  const setTags = React.useCallback((slugs: string[]): void => setSelectedTags(slugs), []);

  return {
    state,
    reload,
    range,
    setRange,
    setDiscipline,
    tagOptions,
    untaggedCount,
    selectedTags,
    setTags,
    toggleTag,
    clearTags,
  };
}

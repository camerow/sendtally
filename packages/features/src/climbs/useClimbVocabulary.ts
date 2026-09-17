import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { ClimbSummary, SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery } from "../query";
import { findClimb, matchClimbs } from "./transforms";

export type ClimbVocabulary = {
  climbs: ClimbSummary[];
  loaded: boolean;
  suggestionsFor: (query: string) => ClimbSummary[];
  isProject: (name: string) => boolean;
  unmarkProject: (climb: ClimbSummary) => Promise<void>;
};

const NO_CLIMBS: ClimbSummary[] = [];

export function useClimbVocabulary(api: SendtallyApi): ClimbVocabulary {
  const client = useQueryClient();
  const { state } = useQuery(queries.climbs(api));
  // A failed load still finishes: suggestions go quiet rather than leaving the
  // screen on a spinner that never resolves.
  const climbs = state.status === "ready" ? state.data : NO_CLIMBS;
  const loaded = state.status !== "loading";

  const suggestionsFor = React.useCallback(
    (query: string): ClimbSummary[] => matchClimbs(climbs, query),
    [climbs]
  );

  const isProject = React.useCallback(
    (name: string): boolean => findClimb(climbs, name)?.project === true,
    [climbs]
  );

  const unmarkProject = React.useCallback(
    async (climb: ClimbSummary): Promise<void> => {
      await api.unmarkProject(climb.slug);
      client.setQueryData(queries.climbs(api).queryKey, (all) =>
        all?.flatMap((c) => {
          if (c.slug !== climb.slug) return [c];
          return c.sessions === 0 ? [] : [{ ...c, project: false }];
        })
      );
    },
    [api, client]
  );

  return { climbs, loaded, suggestionsFor, isProject, unmarkProject };
}

import React from "react";
import type { ClimbSummary, SendtallyApi } from "@sendtally/api-client";
import { findClimb, matchClimbs } from "./transforms";

export type ClimbVocabulary = {
  climbs: ClimbSummary[];
  loaded: boolean;
  reload: () => Promise<void>;
  suggestionsFor: (query: string) => ClimbSummary[];
  isProject: (name: string) => boolean;
  unmarkProject: (climb: ClimbSummary) => Promise<void>;
};

export function useClimbVocabulary(api: SendtallyApi): ClimbVocabulary {
  const [climbs, setClimbs] = React.useState<ClimbSummary[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  // A failed load still finishes: suggestions go quiet rather than leaving the
  // screen on a spinner that never resolves.
  const reload = React.useCallback(async (): Promise<void> => {
    try {
      const result = await api.climbs();
      setClimbs(result.climbs);
    } catch {
      setClimbs([]);
    } finally {
      setLoaded(true);
    }
  }, [api]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload only sets state after its await
    void reload();
  }, [reload]);

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
      setClimbs((all) =>
        all.flatMap((c) => {
          if (c.slug !== climb.slug) return [c];
          return c.sessions === 0 ? [] : [{ ...c, project: false }];
        })
      );
    },
    [api]
  );

  return { climbs, loaded, reload, suggestionsFor, isProject, unmarkProject };
}

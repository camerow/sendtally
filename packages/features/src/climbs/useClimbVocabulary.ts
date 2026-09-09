import React from "react";
import type { ClimbGrade, ClimbSummary, SendtallyApi } from "@sendtally/api-client";
import { findClimb, matchClimbs, sameClimbName } from "./transforms";

export type ClimbVocabulary = {
  climbs: ClimbSummary[];
  loaded: boolean;
  reload: () => Promise<void>;
  suggestionsFor: (query: string) => ClimbSummary[];
  isProject: (name: string) => boolean;
  setProject: (name: string, grade: ClimbGrade, on: boolean) => Promise<void>;
};

export function useClimbVocabulary(api: SendtallyApi): ClimbVocabulary {
  const [climbs, setClimbs] = React.useState<ClimbSummary[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const reload = React.useCallback(async (): Promise<void> => {
    try {
      const result = await api.climbs();
      setClimbs(result.climbs);
      setLoaded(true);
    } catch {
      setClimbs([]);
    }
  }, [api]);

  React.useEffect(() => {
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

  const setProject = React.useCallback(
    async (name: string, grade: ClimbGrade, on: boolean): Promise<void> => {
      const trimmed = name.trim();
      if (trimmed === "") return;
      const known = findClimb(climbs, trimmed);
      if (on) {
        const { project } = await api.markProject(trimmed, grade);
        setClimbs((all) =>
          known === undefined
            ? [
                {
                  ...project,
                  project: true,
                  sessions: 0,
                  attempts: 0,
                  sends: 0,
                  first_at: new Date().toISOString(),
                  last_at: new Date().toISOString(),
                },
                ...all,
              ]
            : all.map((c) => (c.slug === project.slug ? { ...c, project: true } : c))
        );
        return;
      }
      if (known === undefined) return;
      await api.unmarkProject(known.slug);
      setClimbs((all) =>
        all.flatMap((c) => {
          if (!sameClimbName(c.name, trimmed)) return [c];
          return c.sessions === 0 ? [] : [{ ...c, project: false }];
        })
      );
    },
    [api, climbs]
  );

  return { climbs, loaded, reload, suggestionsFor, isProject, setProject };
}

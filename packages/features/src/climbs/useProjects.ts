import React from "react";
import type { ClimbSummary, ProjectInput, SendtallyApi } from "@sendtally/api-client";
import { useQuery, type QueryState } from "../lib/useQuery";
import {
  projectBars,
  projectDetailVM,
  projectsOverview,
  type ProjectBar,
  type ProjectDetailVM,
  type ProjectsOverviewVM,
} from "./projects";
import { projectStatus, projectsOf } from "./transforms";

export type ProjectListItem = { climb: ClimbSummary; bars: ProjectBar[] };

export type ProjectsData = {
  overview: ProjectsOverviewVM;
  open: ProjectListItem[];
  sent: ProjectListItem[];
};

export type ProjectsFeature = {
  state: QueryState<ProjectsData>;
  save: (input: ProjectInput) => Promise<void>;
  reload: () => void;
};

export function useProjects(api: SendtallyApi): ProjectsFeature {
  const load = React.useCallback(async (): Promise<ProjectsData> => {
    const [{ climbs }, { sessions }] = await Promise.all([api.climbs(), api.sessionsWithClimbs()]);
    const items = projectsOf(climbs).map((climb) => ({
      climb,
      bars: projectBars(climb, sessions),
    }));
    return {
      overview: projectsOverview(climbs),
      open: items.filter((i) => projectStatus(i.climb) === "open"),
      sent: items.filter((i) => projectStatus(i.climb) === "sent"),
    };
  }, [api]);

  const { state, reload } = useQuery(load);

  const save = React.useCallback(
    async (input: ProjectInput): Promise<void> => {
      await api.saveProject(input);
      reload();
    },
    [api, reload]
  );

  return { state, save, reload };
}

export type ProjectFeature = {
  state: QueryState<ProjectDetailVM>;
  saveBeta: (beta: string) => Promise<void>;
  unmark: () => Promise<void>;
  reload: () => void;
};

// The detail screen reads the sessions it links to anyway, so the attempts and
// the notes come from the same fetch rather than a project-specific endpoint.
export function useProject(api: SendtallyApi, slug: string): ProjectFeature {
  const load = React.useCallback(async (): Promise<ProjectDetailVM> => {
    const [{ climbs }, { sessions }] = await Promise.all([api.climbs(), api.sessionsWithClimbs()]);
    const climb = climbs.find((c) => c.slug === slug);
    if (climb === undefined) throw new Error("Project not found.");
    return projectDetailVM(climb, sessions);
  }, [api, slug]);

  const { state, reload } = useQuery(load);

  const saveBeta = React.useCallback(
    async (beta: string): Promise<void> => {
      if (state.status !== "ready") return;
      await api.saveProject({ name: state.data.name, beta });
      reload();
    },
    [api, reload, state]
  );

  const unmark = React.useCallback(async (): Promise<void> => {
    await api.unmarkProject(slug);
  }, [api, slug]);

  return { state, saveBeta, unmark, reload };
}

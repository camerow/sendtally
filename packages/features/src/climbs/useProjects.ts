import React from "react";
import type { ClimbSummary, ProjectInput, SendtallyApi } from "@sendtally/api-client";
import { t } from "../i18n";
import { queries, useQueryPair, type QueryState } from "../query";
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
  reload: () => Promise<void>;
};

const useClimbsAndSessions = (api: SendtallyApi) =>
  useQueryPair(queries.climbs(api), queries.sessionsWithClimbs(api));

export function useProjects(api: SendtallyApi): ProjectsFeature {
  const { state: loaded, reload } = useClimbsAndSessions(api);

  const state = React.useMemo((): QueryState<ProjectsData> => {
    if (loaded.status !== "ready") return loaded;
    const [climbs, sessions] = loaded.data;
    const items = projectsOf(climbs).map((climb) => ({
      climb,
      bars: projectBars(climb, sessions),
    }));
    return {
      status: "ready",
      data: {
        overview: projectsOverview(climbs),
        open: items.filter((i) => projectStatus(i.climb) === "open"),
        sent: items.filter((i) => projectStatus(i.climb) === "sent"),
      },
    };
  }, [loaded]);

  const save = React.useCallback(
    async (input: ProjectInput): Promise<void> => {
      await api.saveProject(input);
    },
    [api]
  );

  return { state, save, reload };
}

export type ProjectFeature = {
  state: QueryState<ProjectDetailVM>;
  saveNote: (fingerprint: string, note: string) => Promise<void>;
  unmark: () => Promise<void>;
};

// The detail screen reads the sessions it links to anyway, so the attempts and
// the notes come from the same fetch rather than a project-specific endpoint.
export function useProject(api: SendtallyApi, slug: string): ProjectFeature {
  const { state: loaded } = useClimbsAndSessions(api);

  const state = React.useMemo((): QueryState<ProjectDetailVM> => {
    if (loaded.status !== "ready") return loaded;
    const [climbs, sessions] = loaded.data;
    const climb = climbs.find((c) => c.slug === slug);
    if (climb === undefined) return { status: "error", message: t("climbs.projectNotFound") };
    return { status: "ready", data: projectDetailVM(climb, sessions) };
  }, [loaded, slug]);

  const saveNote = React.useCallback(
    async (fingerprint: string, note: string): Promise<void> => {
      if (state.status !== "ready") return;
      await api.setClimbNote(fingerprint, state.data.slug, note);
    },
    [api, state]
  );

  const unmark = React.useCallback(async (): Promise<void> => {
    await api.unmarkProject(slug);
  }, [api, slug]);

  return { state, saveNote, unmark };
}

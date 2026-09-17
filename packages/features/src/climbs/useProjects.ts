import React from "react";
import type {
  ClimbSummary,
  ProjectInput,
  SendtallyApi,
  SessionWithClimbs,
} from "@sendtally/api-client";
import { t } from "../i18n";
import { bothReady, queries, useQuery, type QueryState } from "../query";
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

function useClimbsAndSessions(api: SendtallyApi): {
  climbs: QueryState<ClimbSummary[]>;
  sessions: QueryState<SessionWithClimbs[]>;
  reload: () => Promise<void>;
} {
  const { state: climbs, reload: reloadClimbs } = useQuery(queries.climbs(api));
  const { state: sessions, reload: reloadSessions } = useQuery(queries.sessionsWithClimbs(api));
  const reload = React.useCallback(async () => {
    await Promise.all([reloadClimbs(), reloadSessions()]);
  }, [reloadClimbs, reloadSessions]);
  return { climbs, sessions, reload };
}

export function useProjects(api: SendtallyApi): ProjectsFeature {
  const { climbs, sessions, reload } = useClimbsAndSessions(api);

  const state = React.useMemo(
    () =>
      bothReady(climbs, sessions, (climbs, sessions): ProjectsData => {
        const items = projectsOf(climbs).map((climb) => ({
          climb,
          bars: projectBars(climb, sessions),
        }));
        return {
          overview: projectsOverview(climbs),
          open: items.filter((i) => projectStatus(i.climb) === "open"),
          sent: items.filter((i) => projectStatus(i.climb) === "sent"),
        };
      }),
    [climbs, sessions]
  );

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
  reload: () => Promise<void>;
};

// The detail screen reads the sessions it links to anyway, so the attempts and
// the notes come from the same fetch rather than a project-specific endpoint.
export function useProject(api: SendtallyApi, slug: string): ProjectFeature {
  const { climbs, sessions, reload } = useClimbsAndSessions(api);

  const state = React.useMemo((): QueryState<ProjectDetailVM> => {
    const joined = bothReady(climbs, sessions, (climbs, sessions) => ({ climbs, sessions }));
    if (joined.status !== "ready") return joined;
    const climb = joined.data.climbs.find((c) => c.slug === slug);
    if (climb === undefined) return { status: "error", message: t("climbs.projectNotFound") };
    return { status: "ready", data: projectDetailVM(climb, joined.data.sessions) };
  }, [climbs, sessions, slug]);

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

  return { state, saveNote, unmark, reload };
}

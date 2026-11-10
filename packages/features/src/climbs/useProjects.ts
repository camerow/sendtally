import React from "react";
import type { ClimbSummary, ProjectInput, SendtallyApi } from "@sendtally/api-client";
import { t } from "../i18n";
import { queries, useQueryPair, type QueryState } from "../query";
import { useGradeScalePrefs } from "../settings/useGradeScales";
import {
  projectBars,
  projectDetailVM,
  projectsOverview,
  type ProjectBar,
  type ProjectDetailVM,
  type ProjectNoteVM,
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
  const { scales } = useGradeScalePrefs(api);

  const state = React.useMemo((): QueryState<ProjectsData> => {
    if (loaded.status !== "ready") return loaded;
    const [climbs, { sessions }] = loaded.data;
    const items = projectsOf(climbs).map((climb) => ({
      climb,
      bars: projectBars(climb, sessions),
    }));
    return {
      status: "ready",
      data: {
        overview: projectsOverview(climbs, scales),
        open: items.filter((i) => projectStatus(i.climb) === "open"),
        sent: items.filter((i) => projectStatus(i.climb) === "sent"),
      },
    };
  }, [loaded, scales]);

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
  /** Rewrites a note; with no text a session's note is cleared and a page note deleted. */
  saveNote: (note: ProjectNoteVM, text: string) => Promise<void>;
  /** A note on the project's page, dated to a day, with no session behind it. */
  addNote: (day: string, note: string) => Promise<void>;
  unmark: () => Promise<void>;
};

// The detail screen reads the sessions it links to anyway, so the attempts and
// the notes come from the same fetch rather than a project-specific endpoint.
export function useProject(api: SendtallyApi, slug: string, newId: () => string): ProjectFeature {
  const { state: loaded, reload } = useClimbsAndSessions(api);
  const { scales } = useGradeScalePrefs(api);
  const climb = loaded.status === "ready" ? loaded.data[0].find((c) => c.slug === slug) : undefined;

  const state = React.useMemo((): QueryState<ProjectDetailVM> => {
    if (loaded.status !== "ready") return loaded;
    if (climb === undefined) return { status: "error", message: t("climbs.projectNotFound") };
    return { status: "ready", data: projectDetailVM(climb, loaded.data[1].sessions, scales) };
  }, [loaded, climb, scales]);

  const saveNote = React.useCallback(
    async ({ id, source, day }: ProjectNoteVM, text: string): Promise<void> => {
      if (climb === undefined) throw new Error("project not loaded");
      if (source === "session") await api.setClimbNote(id, slug, text);
      else if (text === "") await api.deleteClimbNote(climb.id, id);
      else await api.saveClimbNote(climb.id, { id, day, note: text });
      await reload();
    },
    [api, slug, climb, reload]
  );

  const addNote = React.useCallback(
    async (day: string, note: string): Promise<void> => {
      if (climb === undefined) throw new Error("project not loaded");
      await api.saveClimbNote(climb.id, { id: newId(), day, note });
      await reload();
    },
    [api, climb, newId, reload]
  );

  const unmark = React.useCallback(async (): Promise<void> => {
    await api.unmarkProject(slug);
  }, [api, slug]);

  return { state, saveNote, addNote, unmark };
}

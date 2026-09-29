import React from "react";
import type { Gym } from "../gyms/types";
import type { ClimbKind } from "./climbKind";
import { logClimbOnDay, type DayClimbApi } from "./dayClimb";
import { localDate, withQuickClimb } from "./liveSession";
import type { ClimbDraft, GradePrefs } from "./types";
import type { LiveSession } from "./useLiveSession";

export type ClimbEditing = {
  climb: ClimbDraft;
  date: string;
  /** Where the climb sits in the live session; null when it is going to another day. */
  place: { index: number; count: number } | null;
};

export type ClimbEditor = {
  editing: ClimbEditing | null;
  status: "idle" | "saving" | "failed";
  openNew: (prefs: GradePrefs, kind: ClimbKind) => void;
  open: (key: string) => void;
  change: (patch: (climb: ClimbDraft) => ClimbDraft) => void;
  setDate: (date: string) => void;
  /** Today's climb lands in the live session; another day's joins that day's session. */
  save: () => void;
  remove: () => void;
};

type Draft = { climb: ClimbDraft; date: string };

/**
 * The climb sheet's copy of one climb, written out only when it is saved. Save and remove read
 * the copy through a ref: a sheet's dismiss callback can fire Save after Remove closed it, and
 * that late Save must find nothing to put back, nor file a climb that is already on its way.
 * `onFiled` runs once a climb has joined another day's session, for a screen whose list does
 * not refetch on its own.
 */
export function useClimbEditor(
  live: LiveSession,
  api: DayClimbApi,
  gyms: readonly Gym[],
  onFiled?: () => void
): ClimbEditor {
  const [draft, setDraftState] = React.useState<Draft | null>(null);
  const current = React.useRef<Draft | null>(null);
  const setDraft = (next: Draft | null | ((d: Draft | null) => Draft | null)): void => {
    current.current = typeof next === "function" ? next(current.current) : next;
    setDraftState(current.current);
  };
  const [status, setStatusState] = React.useState<ClimbEditor["status"]>("idle");
  const busy = React.useRef(false);
  const setStatus = (next: ClimbEditor["status"]): void => {
    busy.current = next === "saving";
    setStatusState(next);
  };
  const liveClimbs = live.stored?.draft.climbs ?? [];
  const liveDate = live.stored?.draft.date ?? localDate(new Date());
  const toLive = (date: string): boolean => date === liveDate || date === localDate(new Date());
  const inLive = (key: string): boolean => liveClimbs.some((c) => c.key === key);

  const close = (): void => {
    setDraft(null);
    setStatus("idle");
  };

  const place = (d: Draft): ClimbEditing["place"] => {
    if (!toLive(d.date)) return null;
    const index = liveClimbs.findIndex((c) => c.key === d.climb.key);
    return index < 0
      ? { index: liveClimbs.length, count: liveClimbs.length + 1 }
      : { index, count: liveClimbs.length };
  };

  return {
    editing: draft === null ? null : { ...draft, place: place(draft) },
    status,
    openNew: (prefs, kind) => {
      const { draft: next, key } = withQuickClimb(
        live.stored?.draft ?? null,
        new Date(),
        prefs,
        gyms,
        kind
      );
      setDraft({ climb: next.climbs.find((c) => c.key === key)!, date: liveDate });
    },
    open: (key) => {
      const climb = liveClimbs.find((c) => c.key === key);
      if (climb !== undefined) setDraft({ climb, date: liveDate });
    },
    change: (patch) => setDraft((d) => (d === null ? d : { ...d, climb: patch(d.climb) })),
    setDate: (date) => setDraft((d) => (d === null ? d : { ...d, date })),
    save: () => {
      const saving = current.current;
      if (saving === null || busy.current) return;
      const { climb, date } = saving;
      if (toLive(date)) {
        live.putClimb(climb, gyms);
        close();
        return;
      }
      setStatus("saving");
      const moved = inLive(climb.key);
      logClimbOnDay(api, climb, date, gyms).then(
        () => {
          if (moved) live.removeClimb(climb.key);
          close();
          onFiled?.();
        },
        () => setStatus("failed")
      );
    },
    remove: () => {
      const removing = current.current;
      if (removing !== null && inLive(removing.climb.key)) live.removeClimb(removing.climb.key);
      close();
    },
  };
}

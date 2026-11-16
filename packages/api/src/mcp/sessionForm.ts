import { rowMinutes, type StoredClimb } from "@sendtally/core";
import type { z } from "zod";
import type { manualSessionBody } from "../lib/manual";
import type { SessionResponse } from "../sessions";

type SessionInput = z.input<typeof manualSessionBody>;

type ClimbInput = SessionInput["climbs"][number];

const time = (iso: string): string => iso.slice(11, 16);

// A climb as list_sessions shows it and update_session takes it back.
export const climbInput = (climb: StoredClimb & { note?: string | null }): ClimbInput => ({
  name: climb.name,
  grade: climb.grade ?? { scale: "v", value: Math.max(0, climb.vGrade) },
  kind: climb.kind,
  ...(climb.style === undefined ? {} : { style: climb.style }),
  tries: climb.tries,
  ...(climb.note == null ? {} : { note: climb.note }),
  ...(climb.circuit === undefined ? {} : { circuit: climb.circuit }),
  ...(climb.wall === undefined ? {} : { wall: climb.wall }),
  ...(climb.endurance === undefined ? {} : { endurance: climb.endurance }),
});

export const sessionTimes = (row: {
  start_at: string;
  end_at: string;
  times: string;
}): { startTime?: string; endTime?: string; minutes?: number } => ({
  ...(row.times === "both" || row.times === "start" ? { startTime: time(row.start_at) } : {}),
  ...(row.times === "both" || row.times === "end" ? { endTime: time(row.end_at) } : {}),
  ...(row.times === "duration" ? { minutes: rowMinutes(row) } : {}),
});

// A grade-only climb outdoors sits at the day's area, unless a named climb places the day.
export const dayAreaId = (session: SessionResponse): string | undefined =>
  session.location === "outdoor" && !session.climbs.some((c) => c.area !== null)
    ? session.areas[0]?.id
    : undefined;

// The session as the edit form would send it back unchanged, Areas links included.
export const editableSession = (session: SessionResponse): SessionInput => {
  const outdoor = session.location === "outdoor";
  const dayArea = dayAreaId(session);
  return {
    ...(session.name === null ? {} : { name: session.name }),
    date: session.start_at.slice(0, 10),
    ...sessionTimes(session),
    ...(session.rpe_source === "user" ? { rpe: session.rpe } : {}),
    ...(session.rpe_source === "none" ? { unscored: true } : {}),
    ...(session.location === null ? {} : { location: session.location }),
    ...(session.gym_id === null ? {} : { gymId: session.gym_id }),
    tags: session.tags.map((t) => t.name),
    ...(session.notes === null ? {} : { notes: session.notes }),
    climbs: session.climbs.map((c) => {
      const areaId = c.area?.id ?? (c.name.trim() === "" ? dayArea : undefined);
      return {
        ...climbInput(c),
        ...(c.userClimbId === undefined ? {} : { userClimbId: c.userClimbId }),
        ...(areaId === undefined ? {} : { areaId }),
        ...((outdoor || areaId !== undefined) && c.link !== null ? { climbId: c.link.id } : {}),
      };
    }),
  };
};

import { z } from "zod";
import { tagNames } from "./tags";

export const ENTRY_BODY_MAX = 10000;
export const ENTRY_TITLE_MAX = 200;

export const ENTRY_KINDS = ["journal", "trip", "injury"] as const;

export type EntryKind = (typeof ENTRY_KINDS)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((d) => {
    const t = Date.parse(`${d}T00:00:00Z`);
    return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === d;
  }, "not a real date");

export const entryBody = z
  .object({
    kind: z.enum(ENTRY_KINDS),
    occurred_at: isoDate,
    ends_at: isoDate.nullish(),
    title: z.string().max(ENTRY_TITLE_MAX).nullish(),
    body: z.string().max(ENTRY_BODY_MAX).default(""),
    fingerprints: z.array(z.string().max(200)).max(50).optional(),
    parent_id: z.string().max(200).nullish(),
    severity: z.number().int().min(0).max(10).nullish(),
    tags: tagNames.optional(),
  })
  .superRefine((entry, ctx) => {
    if (entry.ends_at != null && entry.ends_at < entry.occurred_at) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "an entry cannot end before it starts",
      });
    }
    if (entry.ends_at != null && entry.kind !== "trip" && entry.kind !== "injury") {
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "only trips and injuries span dates",
      });
    }
    if (entry.parent_id != null && entry.kind !== "journal") {
      ctx.addIssue({
        code: "custom",
        path: ["parent_id"],
        message: "only a journal entry can belong to a thread",
      });
    }
    // The injury itself carries the reading it opened with; everything after it
    // is an update on the thread. Nothing else is measured this way.
    if (entry.severity != null && entry.kind !== "injury" && entry.parent_id == null) {
      ctx.addIssue({
        code: "custom",
        path: ["severity"],
        message: "severity belongs to an injury or one of its updates",
      });
    }
  });

export type EntryBody = z.infer<typeof entryBody>;

type TripDates = {
  id: string | null;
  kind: EntryKind;
  occurred_at: string;
  ends_at: string | null;
};

/** A trip still going has no last day yet, so nothing can start after it. */
const lastDay = (trip: TripDates): string => trip.ends_at ?? "9999-12-31";

/** Two trips never share a day, so every day of the log belongs to at most one. */
export function overlappingTrip<T extends TripDates>(entries: T[], candidate: TripDates): T | null {
  if (candidate.kind !== "trip") return null;
  return (
    entries.find(
      (e) =>
        e.kind === "trip" &&
        e.id !== candidate.id &&
        e.occurred_at <= lastDay(candidate) &&
        lastDay(e) >= candidate.occurred_at
    ) ?? null
  );
}

/** Empty strings are how a cleared optional field arrives from a form. */
export function trimmedOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

export type EntryWrite = {
  kind: EntryKind;
  occurred_at: string;
  ends_at: string | null;
  title: string | null;
  body: string;
  parent_id: string | null;
  severity: number | null;
  status: "ongoing" | "resolved" | null;
};

export function buildEntry(body: EntryBody): EntryWrite {
  const ends_at = body.ends_at ?? null;
  return {
    kind: body.kind,
    occurred_at: body.occurred_at,
    ends_at,
    title: trimmedOrNull(body.title),
    body: body.body.trim(),
    parent_id: trimmedOrNull(body.parent_id),
    severity: body.severity ?? null,
    // An injury is over when it has an end date - the same thing the composer's
    // "still going" field already says. Nothing else has a status.
    status: body.kind !== "injury" ? null : ends_at === null ? "ongoing" : "resolved",
  };
}

import type { Entitlements } from "@sendtally/api-client";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "../i18n";
import { membersGet, trialPanel } from "./benefits";

const NOW = new Date("2026-12-01T12:00:00.000Z");
const RUNNING = new Date(2026, 11, 9, 12).toISOString();
const OVER = "2026-11-01T00:00:00.000Z";
const NONE = { workouts: 0, blocks: 0, exercises: 0 };

const free = (endsAt: string): Entitlements => ({
  membership: { active: false, web: false, store: null },
  trial: { endsAt },
});
const member: Entitlements = {
  ...free(OVER),
  membership: { active: true, web: true, store: null },
};

const line = (made: typeof NONE, endsAt = OVER): string | undefined =>
  membersGet(free(endsAt), made, "lb", NOW)?.line;

afterEach(() => setLocale("en"));

describe("membersGet", () => {
  it("is nothing for a member", () => {
    expect(membersGet(member, NONE, "lb", NOW)).toBeNull();
  });

  it("says when the trial ends while it runs, whatever was made", () => {
    expect(line({ workouts: 3, blocks: 1, exercises: 0 }, RUNNING)).toBe(
      "After Dec 9 these need a membership."
    );
    expect(membersGet(free(RUNNING), null, "lb", NOW)?.line).toBe(
      "After Dec 9 these need a membership."
    );
  });

  it("waits for what was made once the trial is over", () => {
    expect(membersGet(free(OVER), null, "lb", NOW)).toBeNull();
  });

  it("asks for a membership when nothing was made", () => {
    expect(line(NONE)).toBe("These need a membership.");
  });

  it("counts what was made, leaving out a kind with none", () => {
    expect(line({ workouts: 5, blocks: 2, exercises: 4 })).toBe(
      "Your 5 workouts, 2 blocks and 4 exercises are locked, not deleted."
    );
    expect(line({ workouts: 2, blocks: 0, exercises: 0 })).toBe(
      "Your 2 workouts are locked, not deleted."
    );
    expect(line({ workouts: 0, blocks: 1, exercises: 0 })).toBe(
      "Your 1 block is locked, not deleted."
    );
    expect(line({ workouts: 1, blocks: 0, exercises: 1 })).toBe(
      "Your 1 workout and 1 exercise are locked, not deleted."
    );
  });

  it("reads as a sentence in every language", () => {
    setLocale("de");
    expect(line({ workouts: 0, blocks: 1, exercises: 3 })).toBe(
      "Was du erstellt hast, ist gesperrt, nicht gelöscht: 1 Block und 3 Übungen."
    );
    setLocale("fr");
    expect(line({ workouts: 2, blocks: 1, exercises: 1 })).toBe(
      "Ce que tu as créé est verrouillé, pas supprimé : 2 séances, 1 bloc et 1 exercice."
    );
    setLocale("es");
    expect(line({ workouts: 1, blocks: 0, exercises: 0 })).toBe(
      "Lo que creaste está bloqueado, no borrado: 1 entreno."
    );
  });

  it("draws its sample loads in the user's unit", () => {
    const lb = membersGet(free(RUNNING), NONE, "lb", NOW);
    const kg = membersGet(free(RUNNING), NONE, "kg", NOW);
    expect(lb?.bars.map((b) => b.label)).toEqual(["+20", "+25", "+30", "+15"]);
    expect(lb?.exercises.map((e) => e.work)).toEqual(["4 × 3 · +45 lb", "3 × 5 · 135 lb"]);
    expect(kg?.exercises.map((e) => e.work)).toEqual(["4 × 3 · +20 kg", "3 × 5 · 60 kg"]);
    expect(kg?.bars.map((b) => b.deload)).toEqual([false, false, false, true]);
  });
});

describe("trialPanel", () => {
  it("shows only while a free account's trial runs", () => {
    expect(trialPanel(free(RUNNING), NOW)).toEqual({
      eyebrow: "Free trial · ends Dec 9",
      headline: "14 days free.",
      note: "No card needed.",
    });
    expect(trialPanel(free(OVER), NOW)).toBeNull();
    expect(trialPanel({ ...member, trial: { endsAt: RUNNING } }, NOW)).toBeNull();
  });
});

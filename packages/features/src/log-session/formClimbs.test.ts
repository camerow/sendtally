import { describe, expect, it } from "vitest";
import type { ClimbSummary } from "@sendtally/api-client";
import type { Gym } from "../gyms/types";
import {
  isFormProject,
  nextFormClimb,
  withClimb,
  withClimbArea,
  withGym,
  withProjectToggled,
  withSuggestedClimb,
  withTypedClimbName,
} from "./formClimbs";
import { DEFAULT_GRADE_PREFS } from "./types";
import { emptyDraft, newClimb } from "./transforms";

const NOW = new Date(2026, 10, 12, 18, 0);
const blue = { id: "c1", colour: "blue", label: "Blue", low: 3, high: 5 } as const;
const red = { id: "c2", colour: "red", label: "Red", low: 5, high: 7 } as const;
const arch = { id: "g1", name: "Arch", scale: "v", circuits: [blue, red], walls: [] } as Gym;
const barn = { id: "g2", name: "Barn", scale: "v", circuits: [red], walls: [] } as Gym;
const plain = { id: "g3", name: "Plain", scale: "v", circuits: [], walls: [] } as Gym;

const known: ClimbSummary = {
  id: "uc-1",
  slug: "the-prow",
  name: "The Prow",
  grade: { scale: "v", value: 6 },
  discipline: "boulder",
  project: true,
  sessions: 3,
  attempts: 9,
  sends: 0,
  first_at: "2026-06-03T18:00:00.000Z",
  last_at: "2026-09-04T18:00:00.000Z",
  area_climb_id: null,
  area: { id: "a1", name: "Stanage" },
  sent_at: null,
  notes: [],
};

describe("withGym", () => {
  it("keeps a climb's circuit where the new gym has it, else takes its first", () => {
    const onArch = withGym({ ...emptyDraft(NOW), climbs: [newClimb("climb-1", "v")] }, arch);
    expect(onArch.gymId).toBe("g1");
    expect(onArch.climbs[0]?.circuit?.id).toBe("c1");
    const moved = withGym(
      withClimb(onArch, "climb-1", (c) => ({ ...c })),
      barn
    );
    expect(moved.climbs[0]?.circuit?.id).toBe("c2");
  });

  it("takes every climb off circuits for a gym without any, or no gym", () => {
    const onArch = withGym({ ...emptyDraft(NOW), climbs: [newClimb("climb-1", "v")] }, arch);
    expect(withGym(onArch, plain).climbs[0]?.circuit).toBeUndefined();
    const none = withGym(onArch, null);
    expect("gymId" in none).toBe(false);
    expect(none.climbs[0]?.circuit).toBeUndefined();
  });
});

describe("withClimbArea", () => {
  const linked = { ...newClimb("climb-1", "v"), climbId: "ac-1", area: { id: "a1", name: "A" } };

  it("keeps the Areas climb on the same area and drops it on another", () => {
    expect(withClimbArea(linked, { id: "a1", name: "A" }).climbId).toBe("ac-1");
    const elsewhere = withClimbArea(linked, { id: "a2", name: "B" });
    expect(elsewhere).toMatchObject({ area: { id: "a2" } });
    expect(elsewhere.climbId).toBeUndefined();
  });

  it("clears the area and keeps the link when unset", () => {
    const cleared = withClimbArea(linked, null);
    expect(cleared.area).toBeUndefined();
    expect(cleared.climbId).toBe("ac-1");
  });
});

describe("nextFormClimb", () => {
  it("carries the crag forward outdoors only", () => {
    const area = { id: "a1", name: "Stanage" };
    const first = { ...newClimb("climb-1", "v"), area };
    const outdoor = { ...emptyDraft(NOW), location: "outdoor" as const, climbs: [first] };
    const next = nextFormClimb(outdoor, "boulder", DEFAULT_GRADE_PREFS, []);
    expect(next).toMatchObject({ key: "climb-2", area });
    const indoor = nextFormClimb(
      { ...outdoor, location: "indoor" },
      "boulder",
      DEFAULT_GRADE_PREFS,
      []
    );
    expect(indoor.area).toBeUndefined();
  });

  it("starts on the gym's circuit when that is the kind last used", () => {
    const draft = { ...emptyDraft(NOW), climbs: [] };
    expect(nextFormClimb(draft, "g1", DEFAULT_GRADE_PREFS, [arch]).circuit?.id).toBe("c1");
  });
});

describe("project flag", () => {
  const isProject = (name: string): boolean => name === "The Prow";

  it("reads the hand-set flag first, else the user's projects, and toggles from there", () => {
    const climb = { ...newClimb("climb-1", "v"), name: "The Prow" };
    expect(isFormProject(climb, isProject)).toBe(true);
    expect(isFormProject({ ...climb, project: false }, isProject)).toBe(false);
    expect(withProjectToggled(climb, isProject).project).toBe(false);
    expect(withProjectToggled({ ...climb, name: "Other" }, isProject).project).toBe(true);
  });
});

describe("naming a climb", () => {
  const climb = { ...newClimb("climb-1", "v"), climbId: "ac-9", project: true };

  it("links the user's climb a typed name matches and takes its grade", () => {
    const typed = withTypedClimbName(climb, "the prow", [known]);
    expect(typed).toMatchObject({ name: "the prow", userClimbId: "uc-1", grade: "V6" });
    expect(typed.project).toBeUndefined();
    expect(typed.climbId).toBeUndefined();
    expect(withTypedClimbName(climb, "New", [known]).userClimbId).toBeUndefined();
  });

  it("takes the crag of a picked climb outdoors only", () => {
    expect(withSuggestedClimb(climb, known, true)).toMatchObject({
      name: "The Prow",
      project: true,
      area: { id: "a1", name: "Stanage" },
    });
    expect(withSuggestedClimb(climb, known, false).area).toBeUndefined();
  });
});

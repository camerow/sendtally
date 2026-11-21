import { describe, expect, it } from "vitest";
import { newClimb } from "../log-session/transforms";
import type { ClimbDraft } from "../log-session/types";
import { DEFAULT_GRADE_SCALES as SCALES } from "../settings/transforms";
import {
  ADD_OUTCOMES,
  addedClimb,
  addOutcomePill,
  asLogged,
  climbAddedEvent,
  needsClimbName,
  sendsAdded,
} from "./addClimb";

const v4 = (name = ""): ClimbDraft => ({ ...newClimb("climb-1", "v"), grade: "V4", name });

describe("a past climb added by hand", () => {
  it("logs each outcome as one try, with its pill", () => {
    expect(asLogged(v4(), "flash")).toMatchObject({ kind: "send", style: "flash", tries: 1 });
    expect(asLogged(v4(), "send")).toMatchObject({ kind: "send", style: "redpoint", tries: 1 });
    expect(asLogged(v4("Roof"), "project")).toMatchObject({
      kind: "attempt",
      tries: 1,
      project: true,
    });
    expect(asLogged(v4(), "send")).not.toHaveProperty("project");
    expect(asLogged(v4(), "send")).not.toHaveProperty("key");
    expect(ADD_OUTCOMES.map(addOutcomePill)).toEqual([
      { kind: "flash", label: "Flash" },
      { kind: "sent", label: "Sent" },
      { kind: "project", label: "Project" },
    ]);
  });

  it("names a climb by its name, or its discipline when unnamed, and a project must be named", () => {
    expect(asLogged(v4("  Roof  "), "send").name).toBe("Roof");
    expect(addedClimb("0", v4("  Roof  "), "send", { year: 2023, day: null }, SCALES)).toEqual({
      key: "0",
      gradeLabel: "V4",
      name: "Roof",
      when: "2023",
      outcome: "send",
    });
    expect(addedClimb("1", v4(), "flash", { year: 2023, day: null }, SCALES).name).toBe("Boulder");
    expect(needsClimbName(v4(" "), "project")).toBe(true);
    expect(needsClimbName(v4("Roof"), "project")).toBe(false);
    expect(needsClimbName(v4(), "send")).toBe(false);
  });

  it("dates by year or by day and counts the sends", () => {
    expect(climbAddedEvent(v4(), "flash", null)).toEqual({
      kind: "boulder",
      outcome: "flash",
      dated: "year",
    });
    expect(climbAddedEvent(v4(), "send", "2024-03-05").dated).toBe("day");
    const day = addedClimb("0", v4(), "send", { year: 2023, day: "2024-03-05" }, SCALES).when;
    expect(day).toMatch(/5/);
    expect(day).toMatch(/2024/);
    expect(day).not.toMatch(/2023/);
    const added = ADD_OUTCOMES.map((o, i) =>
      addedClimb(`${i}`, v4("Roof"), o, { year: 2023, day: null }, SCALES)
    );
    expect(sendsAdded(added)).toBe(2);
  });
});

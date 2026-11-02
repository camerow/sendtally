import { describe, expect, it } from "vitest";
import { categoryShelves } from "./shelves";

describe("categoryShelves", () => {
  it("shows all five categories in order, empty ones too, without archived entries", () => {
    const shelves = categoryShelves([
      { kind: "strength", name: "Squat" },
      { kind: "strength", name: "Bench press" },
      { kind: "mobility", name: "Pigeon", archived: true },
      { kind: "hangboard", name: "Half crimp" },
    ]);
    expect(shelves.map((s) => [s.kind, s.entries.map((e) => e.name)])).toEqual([
      ["hangboard", ["Half crimp"]],
      ["climbing", []],
      ["strength", ["Bench press", "Squat"]],
      ["mobility", []],
      ["other", []],
    ]);
  });
});

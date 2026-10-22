import { describe, expect, it } from "@jest/globals";
import type { TrainingBlock } from "@sendtally/api-client";
import { blockTag } from "./blockText";

const block: TrainingBlock = {
  id: "b1",
  name: "Autumn finger block",
  start: "2026-09-28",
  weeks: 3,
  loads: [{ load: 100 }, { load: 110 }, { load: 60, phase: "deload" }],
  notes: null,
  endedOn: null,
};

describe("block tags", () => {
  it("names the week, then its phase and its load when not the base", () => {
    expect(blockTag("Hangboard", block, "2026-09-30")).toBe("Hangboard · week 1 of 3");
    expect(blockTag("Hangboard", block, "2026-10-06")).toBe("Hangboard · week 2 of 3 · 110% load");
    expect(blockTag("Hangboard", block, "2026-10-13")).toBe(
      "Hangboard · week 3 of 3 · Deload · 60% load"
    );
    expect(blockTag("Hangboard", block, "2026-10-19")).toBeNull();
  });
});

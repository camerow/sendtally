import { describe, expect, it } from "vitest";
import type { DatedBlock } from "@sendtally/core/hang";
import { blockDateRange, blockTag } from "./blockText";

const block: DatedBlock = {
  id: "b1",
  name: "Autumn finger block",
  start: "2026-09-28",
  weeks: 3,
  focus: null,
};

describe("block text", () => {
  it("names the week a date falls in, and nothing outside the block", () => {
    expect(blockTag("Hangboard", block, "2026-09-30")).toBe("Hangboard · week 1 of 3");
    expect(blockTag("Hangboard", block, "2026-10-13")).toBe("Hangboard · week 3 of 3");
    expect(blockTag("Hangboard", block, "2026-10-19")).toBeNull();
  });

  it("gives the first and last day", () => {
    expect(blockDateRange(block)).toBe("Mon, Sep 28 to Sun, Oct 18");
  });
});

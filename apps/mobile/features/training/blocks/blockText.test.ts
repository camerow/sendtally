import { describe, expect, it } from "@jest/globals";
import type { Block } from "@sendtally/core/hang";
import { blockDates, blockTag } from "./blockText";

const block: Block = {
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
    expect(blockDates(block)).toBe("Mon, Sep 28 to Sun, Oct 18");
  });
});

import { describe, expect, it } from "vitest";
import { DUPLICATE_THRESHOLD, isLikelyDuplicate, nameSimilarity } from "./similarity";

describe("nameSimilarity", () => {
  it.each([
    { a: "mandala", b: "mandala", score: 1 },
    { a: "the-mandala", b: "mandala", score: 12 / 18 },
    { a: "midnight-lightning", b: "midnight-lightening", score: 28 / 33 },
    { a: "mandala", b: "midnight-lightning", score: 0 },
    { a: "ab", b: "ab", score: 1 },
    { a: "a", b: "b", score: 0 },
    { a: "", b: "mandala", score: 0 },
    { a: "", b: "", score: 0 },
  ])("scores $a against $b", ({ a, b, score }) => {
    expect(nameSimilarity(a, b)).toBeCloseTo(score);
    expect(nameSimilarity(b, a)).toBeCloseTo(score);
  });

  it("pads keys with boundary markers so a two-letter key still has trigrams", () => {
    expect(nameSimilarity("ab", "ac")).toBe(0);
    expect(nameSimilarity("ab", "abc")).toBeGreaterThan(0);
  });
});

describe("isLikelyDuplicate", () => {
  it.each([
    { key: "mandala", candidate: "mandala", duplicate: true },
    { key: "the-mandala", candidate: "mandala", duplicate: true },
    { key: "midnight-lightning", candidate: "midnight-lightening", duplicate: true },
    { key: "mandala", candidate: "midnight-lightning", duplicate: false },
    { key: "x", candidate: "x", duplicate: true },
    { key: "", candidate: "", duplicate: false },
  ])("$key vs $candidate is $duplicate", ({ key, candidate, duplicate }) => {
    expect(isLikelyDuplicate(key, candidate)).toBe(duplicate);
  });

  it("uses 0.6 as the threshold", () => {
    expect(DUPLICATE_THRESHOLD).toBe(0.6);
  });
});

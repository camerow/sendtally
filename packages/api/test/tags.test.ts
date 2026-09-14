import { describe, expect, it } from "vitest";
import { normalizeTagNames, tagSlug } from "../src/lib/tags";

describe("tagSlug", () => {
  const cases: Array<[string, string]> = [
    ["endurance", "endurance"],
    ["Power Endurance", "power-endurance"],
    ["Moe's Valley", "moes-valley"],
    ["Moe’s Valley", "moes-valley"],
    ["  Bishop  ", "bishop"],
    ["Cafe\u0301 Kraft", "cafe-kraft"],
    ["Café Kraft", "cafe-kraft"],
    ["4x4s", "4x4s"],
    ["--home--", "home"],
    ["!!!", ""],
  ];

  it.each(cases)("slugs %j as %j", (name, slug) => {
    expect(tagSlug(name)).toBe(slug);
  });
});

describe("normalizeTagNames", () => {
  it("trims, collapses whitespace, and keeps the display name", () => {
    expect(normalizeTagNames(["  Power   Endurance "])).toEqual([
      { name: "Power Endurance", slug: "power-endurance" },
    ]);
  });

  it("keeps the first spelling when two names share a slug", () => {
    expect(normalizeTagNames(["Bishop", "bishop", "BISHOP"])).toEqual([
      { name: "Bishop", slug: "bishop" },
    ]);
  });

  it("rejects a name with nothing sluggable in it", () => {
    expect(normalizeTagNames(["endurance", "!!!"])).toBeNull();
  });

  it("accepts an empty list", () => {
    expect(normalizeTagNames([])).toEqual([]);
  });
});

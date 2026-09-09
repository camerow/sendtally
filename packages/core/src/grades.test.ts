import { describe, expect, it } from "vitest";
import {
  FRENCH_GRADES,
  YDS_GRADES,
  convertGrade,
  disciplineOf,
  effortGrade,
  fontFromV,
  formatGrade,
  frenchFromRouteIndex,
  parseGrade,
  routeIndexFromFrench,
  routeIndexFromV,
  routeIndexFromYds,
  v,
  vFromDisplay,
  vFromFont,
  vFromRouteIndex,
  ydsFromRouteIndex,
} from "./grades";

describe("v", () => {
  const cases: Array<[difficulty: number, want: number | undefined]> = [
    [1, 0],
    [12, 0],
    [13, 1],
    [15, 2],
    [18, 4],
    [22, 6],
    [23, 7],
    [27, 10],
    [39, 22],
    [0, undefined],
    [40, undefined],
  ];

  it.each(cases)("v(%i) = %s", (difficulty, want) => {
    expect(v(difficulty)).toBe(want);
  });
});

describe("vFromDisplay", () => {
  it("truncates within a grade band", () => {
    expect(vFromDisplay(18.4)).toBe(4);
  });

  it("rounds up across a band boundary", () => {
    expect(vFromDisplay(22.6)).toBe(7);
  });
});

describe("vFromFont", () => {
  const cases: Array<[font: string, want: number | undefined]> = [
    ["4", 0],
    ["5", 1],
    ["5+", 2],
    ["6A", 3],
    ["6a+", 3],
    ["6B+", 4],
    ["6C", 5],
    ["7A", 6],
    ["7a+", 7],
    ["7B", 8],
    ["7C+", 10],
    ["8A", 11],
    ["8b+", 14],
    ["9A", 17],
    [" 6b ", 4],
    ["6D", undefined],
    ["V5", undefined],
    ["", undefined],
  ];

  it.each(cases)("vFromFont(%j) = %s", (font, want) => {
    expect(vFromFont(font)).toBe(want);
  });
});

describe("fontFromV", () => {
  it("round-trips through vFromFont for every V grade", () => {
    for (let grade = 0; grade <= 17; grade++) {
      const font = fontFromV(grade);
      expect(font).toBeDefined();
      expect(vFromFont(font!)).toBe(grade);
    }
  });

  it("is undefined outside the boulder range", () => {
    expect(fontFromV(-1)).toBeUndefined();
    expect(fontFromV(18)).toBeUndefined();
  });
});

describe("route grades", () => {
  const pairs: Array<[french: string, yds: string, v: number]> = [
    ["4a", "5.5", 0],
    ["5b", "5.9", 0],
    ["6a", "5.10b", 0],
    ["6a+", "5.10c", 1],
    ["6c", "5.11b", 2],
    ["7a", "5.11d", 3],
    ["7a+", "5.12a", 4],
    ["7c", "5.12d", 6],
    ["8a", "5.13b", 8],
    ["8b+", "5.14a", 10],
    ["9a", "5.14d", 13],
    ["9c", "5.15d", 17],
  ];

  it.each(pairs)("%s and %s share an index scoring as V%i", (french, yds, want) => {
    const index = routeIndexFromFrench(french);
    expect(index).toBeDefined();
    expect(routeIndexFromYds(yds)).toBe(index);
    expect(frenchFromRouteIndex(index!)).toBe(french);
    expect(ydsFromRouteIndex(index!)).toBe(yds);
    expect(vFromRouteIndex(index!)).toBe(want);
    expect(effortGrade({ scale: "french", value: french })).toBe(want);
    expect(effortGrade({ scale: "yds", value: yds })).toBe(want);
  });

  it("lists the tables in ascending order", () => {
    expect(FRENCH_GRADES[0]).toBe("4a");
    expect(YDS_GRADES[0]).toBe("5.5");
    expect(FRENCH_GRADES.length).toBe(YDS_GRADES.length);
    expect(FRENCH_GRADES[FRENCH_GRADES.length - 1]).toBe("9c");
  });

  it("ignores case and whitespace when parsing", () => {
    expect(routeIndexFromFrench(" 7A+ ")).toBe(routeIndexFromFrench("7a+"));
    expect(routeIndexFromYds("5.11B")).toBe(routeIndexFromYds("5.11b"));
  });

  it.each(["5.10", "5.10+", "5.16a", "6d", "V4", ""])("rejects %j", (text) => {
    expect(routeIndexFromYds(text)).toBeUndefined();
    expect(routeIndexFromFrench(text)).toBeUndefined();
    expect(parseGrade("yds", text)).toBeUndefined();
    expect(parseGrade("french", text)).toBeUndefined();
  });

  it("picks the hardest route that scores as the given V grade", () => {
    expect(ydsFromRouteIndex(routeIndexFromV(0))).toBe("5.10b");
    expect(ydsFromRouteIndex(routeIndexFromV(4))).toBe("5.12b");
    expect(ydsFromRouteIndex(routeIndexFromV(-1))).toBe("5.10b");
    expect(frenchFromRouteIndex(routeIndexFromV(40))).toBe("9c");
  });
});

describe("parseGrade and formatGrade", () => {
  it("normalises each scale", () => {
    expect(parseGrade("v", "v4")).toEqual({ scale: "v", value: 4 });
    expect(parseGrade("font", "6b+")).toEqual({ scale: "font", value: "6B+" });
    expect(parseGrade("yds", "5.11B")).toEqual({ scale: "yds", value: "5.11b" });
    expect(parseGrade("french", "7A")).toEqual({ scale: "french", value: "7a" });
    expect(parseGrade("v", "V-1")).toBeUndefined();
    expect(parseGrade("font", "6D")).toBeUndefined();
  });

  it("formats grades the way climbers write them", () => {
    expect(formatGrade({ scale: "v", value: 4 })).toBe("V4");
    expect(formatGrade({ scale: "v", value: -1 })).toBe("V?");
    expect(formatGrade({ scale: "font", value: "6b+" })).toBe("6B+");
    expect(formatGrade({ scale: "yds", value: "5.11B" })).toBe("5.11b");
    expect(formatGrade({ scale: "french", value: "7A" })).toBe("7a");
  });
});

describe("convertGrade", () => {
  it("converts within a discipline exactly", () => {
    expect(convertGrade({ scale: "v", value: 4 }, "font")).toEqual({ scale: "font", value: "6B" });
    expect(convertGrade({ scale: "font", value: "7A" }, "v")).toEqual({ scale: "v", value: 6 });
    expect(convertGrade({ scale: "yds", value: "5.12a" }, "french")).toEqual({
      scale: "french",
      value: "7a+",
    });
    expect(convertGrade({ scale: "french", value: "6c" }, "yds")).toEqual({
      scale: "yds",
      value: "5.11b",
    });
  });

  it("crosses disciplines through the effort scale", () => {
    expect(convertGrade({ scale: "v", value: 4 }, "yds")).toEqual({ scale: "yds", value: "5.12b" });
    expect(convertGrade({ scale: "yds", value: "5.13a" }, "v")).toEqual({ scale: "v", value: 7 });
    expect(convertGrade({ scale: "french", value: "7c" }, "font")).toEqual({
      scale: "font",
      value: "7A",
    });
  });

  it("returns undefined for unknown grades", () => {
    expect(convertGrade({ scale: "yds", value: "5.10" }, "french")).toBeUndefined();
    expect(convertGrade({ scale: "v", value: -1 }, "yds")).toBeUndefined();
  });

  it("keeps a known grade when the scale does not change", () => {
    expect(convertGrade({ scale: "yds", value: "5.10a" }, "yds")).toEqual({
      scale: "yds",
      value: "5.10a",
    });
  });
});

describe("disciplineOf", () => {
  it("splits boulder scales from route scales", () => {
    expect(disciplineOf("v")).toBe("boulder");
    expect(disciplineOf("font")).toBe("boulder");
    expect(disciplineOf("yds")).toBe("route");
    expect(disciplineOf("french")).toBe("route");
  });
});

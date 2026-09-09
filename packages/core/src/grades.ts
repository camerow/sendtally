const V_BY_DIFFICULTY: ReadonlyMap<number, number> = new Map([
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [10, 0],
  [11, 0],
  [12, 0],
  [13, 1],
  [14, 1],
  [15, 2],
  [16, 3],
  [17, 3],
  [18, 4],
  [19, 4],
  [20, 5],
  [21, 5],
  [22, 6],
  [23, 7],
  [24, 8],
  [25, 8],
  [26, 9],
  [27, 10],
  [28, 11],
  [29, 12],
  [30, 13],
  [31, 14],
  [32, 15],
  [33, 16],
  [34, 17],
  [35, 18],
  [36, 19],
  [37, 20],
  [38, 21],
  [39, 22],
]);

export function v(difficulty: number): number | undefined {
  return V_BY_DIFFICULTY.get(difficulty);
}

export function vFromDisplay(display: number): number | undefined {
  return v(Math.round(display));
}

const V_BY_FONT: ReadonlyMap<string, number> = new Map([
  ["1", 0],
  ["2", 0],
  ["3", 0],
  ["4", 0],
  ["4+", 0],
  ["5", 1],
  ["5+", 2],
  ["6A", 3],
  ["6A+", 3],
  ["6B", 4],
  ["6B+", 4],
  ["6C", 5],
  ["6C+", 5],
  ["7A", 6],
  ["7A+", 7],
  ["7B", 8],
  ["7B+", 8],
  ["7C", 9],
  ["7C+", 10],
  ["8A", 11],
  ["8A+", 12],
  ["8B", 13],
  ["8B+", 14],
  ["8C", 15],
  ["8C+", 16],
  ["9A", 17],
]);

export const FONT_GRADES: readonly string[] = [...V_BY_FONT.keys()];

export function vFromFont(font: string): number | undefined {
  return V_BY_FONT.get(font.trim().toUpperCase());
}

const FONT_BY_V: readonly string[] = [
  "4",
  "5",
  "5+",
  "6A",
  "6B",
  "6C",
  "7A",
  "7A+",
  "7B",
  "7C",
  "7C+",
  "8A",
  "8A+",
  "8B",
  "8B+",
  "8C",
  "8C+",
  "9A",
];

export function fontFromV(vGrade: number): string | undefined {
  return FONT_BY_V[vGrade];
}

export type GradeScale = "v" | "font" | "yds" | "french";

export type Discipline = "boulder" | "route";

export type Grade =
  | { scale: "v"; value: number }
  | { scale: "font"; value: string }
  | { scale: "yds"; value: string }
  | { scale: "french"; value: string };

export function disciplineOf(scale: GradeScale): Discipline {
  return scale === "v" || scale === "font" ? "boulder" : "route";
}

const ROUTE_TABLE: ReadonlyArray<readonly [french: string, yds: string, vEquivalent: number]> = [
  ["4a", "5.5", 0],
  ["4b", "5.6", 0],
  ["4c", "5.7", 0],
  ["5a", "5.8", 0],
  ["5b", "5.9", 0],
  ["5c", "5.10a", 0],
  ["6a", "5.10b", 0],
  ["6a+", "5.10c", 1],
  ["6b", "5.10d", 1],
  ["6b+", "5.11a", 2],
  ["6c", "5.11b", 2],
  ["6c+", "5.11c", 3],
  ["7a", "5.11d", 3],
  ["7a+", "5.12a", 4],
  ["7b", "5.12b", 4],
  ["7b+", "5.12c", 5],
  ["7c", "5.12d", 6],
  ["7c+", "5.13a", 7],
  ["8a", "5.13b", 8],
  ["8a+", "5.13c", 8],
  ["8b", "5.13d", 9],
  ["8b+", "5.14a", 10],
  ["8c", "5.14b", 11],
  ["8c+", "5.14c", 12],
  ["9a", "5.14d", 13],
  ["9a+", "5.15a", 14],
  ["9b", "5.15b", 15],
  ["9b+", "5.15c", 16],
  ["9c", "5.15d", 17],
];

export const FRENCH_GRADES: readonly string[] = ROUTE_TABLE.map(([french]) => french);

export const YDS_GRADES: readonly string[] = ROUTE_TABLE.map(([, yds]) => yds);

const INDEX_BY_FRENCH: ReadonlyMap<string, number> = new Map(
  ROUTE_TABLE.map(([french], i) => [french, i])
);

const INDEX_BY_YDS: ReadonlyMap<string, number> = new Map(
  ROUTE_TABLE.map(([, yds], i) => [yds, i])
);

export function routeIndexFromFrench(french: string): number | undefined {
  return INDEX_BY_FRENCH.get(french.trim().toLowerCase());
}

export function routeIndexFromYds(yds: string): number | undefined {
  return INDEX_BY_YDS.get(yds.trim().toLowerCase());
}

export function frenchFromRouteIndex(index: number): string | undefined {
  return ROUTE_TABLE[index]?.[0];
}

export function ydsFromRouteIndex(index: number): string | undefined {
  return ROUTE_TABLE[index]?.[1];
}

export function vFromRouteIndex(index: number): number | undefined {
  return ROUTE_TABLE[index]?.[2];
}

export function routeIndexFromV(vGrade: number): number {
  const ceiling = ROUTE_TABLE[ROUTE_TABLE.length - 1]![2];
  const target = Math.min(Math.max(vGrade, 0), ceiling);
  let match = 0;
  ROUTE_TABLE.forEach(([, , v], i) => {
    if (v <= target) match = i;
  });
  return match;
}

export function routeIndexOf(grade: Grade): number | undefined {
  switch (grade.scale) {
    case "yds":
      return routeIndexFromYds(grade.value);
    case "french":
      return routeIndexFromFrench(grade.value);
    default:
      return undefined;
  }
}

export function effortGrade(grade: Grade): number {
  switch (grade.scale) {
    case "v":
      return Number.isInteger(grade.value) && grade.value >= 0 ? grade.value : -1;
    case "font":
      return vFromFont(grade.value) ?? -1;
    case "yds":
    case "french": {
      const index = routeIndexOf(grade);
      return index === undefined ? -1 : (vFromRouteIndex(index) ?? -1);
    }
  }
}

export function isKnownGrade(grade: Grade): boolean {
  return effortGrade(grade) >= 0;
}

export function formatGrade(grade: Grade): string {
  switch (grade.scale) {
    case "v":
      return grade.value >= 0 ? `V${grade.value}` : "V?";
    case "font":
      return grade.value.trim().toUpperCase();
    case "yds":
      return grade.value.trim().toLowerCase();
    case "french":
      return grade.value.trim().toLowerCase();
  }
}

export function parseGrade(scale: GradeScale, text: string): Grade | undefined {
  const trimmed = text.trim();
  switch (scale) {
    case "v": {
      const n = Number(trimmed.replace(/^V/i, ""));
      return Number.isInteger(n) && n >= 0 ? { scale: "v", value: n } : undefined;
    }
    case "font":
      return vFromFont(trimmed) === undefined ? undefined : { scale, value: trimmed.toUpperCase() };
    case "yds":
      return routeIndexFromYds(trimmed) === undefined
        ? undefined
        : { scale, value: trimmed.toLowerCase() };
    case "french":
      return routeIndexFromFrench(trimmed) === undefined
        ? undefined
        : { scale, value: trimmed.toLowerCase() };
  }
}

export function routeGradeFromIndex(scale: "yds" | "french", index: number): Grade | undefined {
  const value = scale === "yds" ? ydsFromRouteIndex(index) : frenchFromRouteIndex(index);
  return value === undefined ? undefined : { scale, value };
}

export function boulderGradeFromV(scale: "v" | "font", vGrade: number): Grade | undefined {
  if (scale === "v") return vGrade >= 0 ? { scale, value: vGrade } : undefined;
  const font = fontFromV(vGrade);
  return font === undefined ? undefined : { scale, value: font };
}

export function convertGrade(grade: Grade, to: GradeScale): Grade | undefined {
  if (grade.scale === to) return isKnownGrade(grade) ? grade : undefined;
  const v = effortGrade(grade);
  if (v < 0) return undefined;
  if (to === "v" || to === "font") return boulderGradeFromV(to, v);
  const index = disciplineOf(grade.scale) === "route" ? routeIndexOf(grade)! : routeIndexFromV(v);
  return routeGradeFromIndex(to, index);
}

import type { AreaClimb, AreaSummary, ClimbSummary } from "@sendtally/api-client";
import { t } from "../i18n";
import { MAX_CLIMB_SUGGESTIONS, climbKey, sameClimbName } from "./transforms";

/** A name under the climb field: the crag's own from Areas first, then the user's. */
export type ClimbSuggestion =
  | { kind: "areas"; key: string; name: string; meta: string; climb: AreaClimb }
  | { kind: "mine"; key: string; name: string; meta: string; climb: ClimbSummary };

const includes = (name: string, q: string): boolean => name.toLowerCase().includes(q);

export function climbSuggestions(
  query: string,
  mine: readonly ClimbSummary[],
  found: readonly AreaClimb[],
  crag: string | null
): ClimbSuggestion[] {
  const q = climbKey(query);
  if (q === "") return [];
  const areas = found
    .filter((c) => includes(c.name, q))
    .slice(0, MAX_CLIMB_SUGGESTIONS)
    .map((climb): ClimbSuggestion => ({
      kind: "areas",
      key: `areas:${climb.id}`,
      name: climb.name,
      meta: [climb.grade_value, crag].filter((p) => p !== null).join(" · "),
      climb,
    }));
  const own = mine
    .filter((c) => includes(c.name, q) && !areas.some((a) => sameClimbName(a.name, c.name)))
    .slice(0, MAX_CLIMB_SUGGESTIONS)
    .map((climb): ClimbSuggestion => ({
      kind: "mine",
      key: `mine:${climb.id}`,
      name: climb.name,
      meta: `${t("climbs.yoursShort")} · ${t("climbs.dayCount", { count: climb.sessions })}`,
      climb,
    }));
  return [...areas, ...own];
}

/** A typed name nobody has, in Areas or the user's own climbs, is a new climb. */
export function isNewClimb(
  name: string,
  mine: readonly ClimbSummary[],
  found: readonly AreaClimb[]
): boolean {
  return (
    climbKey(name) !== "" &&
    !mine.some((c) => sameClimbName(c.name, name)) &&
    !found.some((c) => sameClimbName(c.name, name))
  );
}

/** The crag a log saves at: the one picked, one Areas has under the typed name, or a new one. */
export type CragChoice =
  { kind: "area"; area: { id: string; name: string } } | { kind: "new"; name: string } | null;

export function cragChoice(
  typed: string,
  picked: { id: string; name: string } | null,
  found: readonly AreaSummary[]
): CragChoice {
  if (picked !== null) return { kind: "area", area: picked };
  if (climbKey(typed) === "") return null;
  const same = found.find((a) => sameClimbName(a.name, typed));
  return same === undefined
    ? { kind: "new", name: typed.trim() }
    : { kind: "area", area: { id: same.id, name: same.name } };
}

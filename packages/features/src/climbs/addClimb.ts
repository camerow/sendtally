import type { AreaClimb, AreaSummary, ClimbSummary, SendtallyApi } from "@sendtally/api-client";
import { t } from "../i18n";
import { MAX_CLIMB_SUGGESTIONS, climbKey, sameClimbName } from "./transforms";

/** A name under the climb field: the area's own from Areas first, then the user's. */
export type ClimbSuggestion =
  | { kind: "areas"; key: string; name: string; meta: string; climb: AreaClimb }
  | { kind: "mine"; key: string; name: string; meta: string; climb: ClimbSummary };

const includes = (name: string, q: string): boolean => name.toLowerCase().includes(q);

export function climbSuggestions(
  query: string,
  mine: readonly ClimbSummary[],
  found: readonly AreaClimb[],
  area: string | null
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
      meta: [climb.grade_value, area].filter((p) => p !== null).join(" · "),
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

type Place = { id: string; name: string };

/** The area a log saves at: the one picked, one Areas has under the typed name, or a new one. */
export type AreaChoice = { kind: "area"; area: Place } | { kind: "new"; name: string } | null;

export function areaChoice(
  typed: string,
  picked: Place | null,
  found: readonly AreaSummary[]
): AreaChoice {
  if (picked !== null) return { kind: "area", area: picked };
  if (climbKey(typed) === "") return null;
  const same = found.find((a) => sameClimbName(a.name, typed));
  return same === undefined
    ? { kind: "new", name: typed.trim() }
    : { kind: "area", area: { id: same.id, name: same.name } };
}

/**
 * The area to save at, adding a new one to Areas as typed: top level, pending review, and
 * without asking where it is, since the name was already searched for.
 */
export async function placeOf(
  api: Pick<SendtallyApi, "createArea">,
  choice: AreaChoice
): Promise<Place | null> {
  if (choice?.kind !== "new") return choice?.area ?? null;
  const { area } = await api.createArea({ name: choice.name, confirmedNew: true });
  if (area === null) throw new Error("area not created");
  return { id: area.id, name: area.name };
}

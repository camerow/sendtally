import {
  enduranceDisplayValue,
  enduranceTimeUnit,
  enduranceTotals,
  type Endurance,
  type EnduranceTotals,
  type EnduranceUnit,
} from "@sendtally/core";
import { formatNumber, t } from "../i18n";
import type { ClimbDraft } from "./types";

export { enduranceTimeUnit, enduranceTotals };
export type { Endurance, EnduranceTotals, EnduranceUnit };

const MAX_TARGET = 3600;
const MAX_LAPS = 60;

const DEFAULT_TARGET: Record<EnduranceUnit, number> = { moves: 20, seconds: 600 };

export function defaultEndurance(): Endurance {
  return { unit: "moves", target: DEFAULT_TARGET.moves, laps: [DEFAULT_TARGET.moves] };
}

export function enduranceStep(unit: EnduranceUnit): number {
  return unit === "moves" ? 1 : 15;
}

export function enduranceOf(climb: ClimbDraft): Endurance {
  return climb.endurance ?? defaultEndurance();
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

/** The API rejects anything else, and a circuit is not a project. */
function withEndurance(climb: ClimbDraft, endurance: Endurance): ClimbDraft {
  const { project: _project, ...rest } = climb;
  return { ...rest, kind: "send", style: "redpoint", tries: 1, endurance };
}

export function withoutEndurance(climb: ClimbDraft): ClimbDraft {
  const { endurance: _endurance, ...rest } = climb;
  return rest;
}

export function asEnduranceClimb(climb: ClimbDraft): ClimbDraft {
  return withEndurance(climb, defaultEndurance());
}

/** Moves and seconds are different scales, so switching starts the circuit over. */
export function withEnduranceUnit(climb: ClimbDraft, unit: EnduranceUnit): ClimbDraft {
  const target = DEFAULT_TARGET[unit];
  return withEndurance(climb, { unit, target, laps: [target] });
}

export function withEnduranceTarget(climb: ClimbDraft, target: number): ClimbDraft {
  const e = enduranceOf(climb);
  const next = clamp(target, 1, MAX_TARGET);
  return withEndurance(climb, {
    ...e,
    target: next,
    laps: e.laps.map((lap) => Math.min(lap, next)),
  });
}

export function addLap(climb: ClimbDraft): ClimbDraft {
  const e = enduranceOf(climb);
  if (e.laps.length >= MAX_LAPS) return climb;
  return withEndurance(climb, { ...e, laps: [...e.laps, e.target] });
}

export function withLap(climb: ClimbDraft, index: number, done: number): ClimbDraft {
  const e = enduranceOf(climb);
  if (index < 0 || index >= e.laps.length) return climb;
  const value = clamp(done, 0, e.target);
  return withEndurance(climb, { ...e, laps: e.laps.map((lap, i) => (i === index ? value : lap)) });
}

export function removeLap(climb: ClimbDraft): ClimbDraft {
  const e = enduranceOf(climb);
  if (e.laps.length <= 1) return climb;
  return withEndurance(climb, { ...e, laps: e.laps.slice(0, -1) });
}

export function isCleanLap(e: Endurance, index: number): boolean {
  return e.laps[index] === e.target;
}

export function enduranceUnitLabel(unit: EnduranceUnit): string {
  return t(unit === "moves" ? "endurance.unitMoves" : "endurance.unitTime");
}

export function enduranceAmountLabel(e: Endurance, value: number): string {
  const shown = enduranceDisplayValue(e, value);
  const formatted = formatNumber(shown, { maximumFractionDigits: 1 });
  if (e.unit === "moves") return t("endurance.amountMoves", { count: shown, value: formatted });
  const key = enduranceTimeUnit(e.target) === "min" ? "endurance.amountMin" : "endurance.amountSec";
  return t(key, { value: formatted });
}

/** Moves carry the unit once at the end; a time pair carries it on both sides. */
function doneLabel(e: Endurance, value: number): string {
  if (e.unit !== "moves") return enduranceAmountLabel(e, value);
  return formatNumber(enduranceDisplayValue(e, value));
}

export function enduranceProgressLabel(e: Endurance): string {
  const { done, total } = enduranceTotals(e);
  return t("endurance.progress", {
    done: doneLabel(e, done),
    amount: enduranceAmountLabel(e, total),
  });
}

export function enduranceLapLabel(e: Endurance, index: number): string {
  return t("endurance.lapShort", {
    done: doneLabel(e, e.laps[index] ?? 0),
    amount: enduranceAmountLabel(e, e.target),
  });
}

export function enduranceLapCountLabel(laps: number): string {
  return t("endurance.lapCount", { count: laps });
}

export function enduranceCleanLabel(e: Endurance): string {
  const { laps, clean } = enduranceTotals(e);
  return t("endurance.cleanOf", { clean, laps });
}

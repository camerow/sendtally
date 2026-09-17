import {
  enduranceTimeParts,
  enduranceTotals,
  type Endurance,
  type EnduranceTotals,
  type EnduranceUnit,
} from "@sendtally/core";
import { formatNumber, t } from "../i18n";
import type { ClimbDraft } from "./types";

export { enduranceTimeParts, enduranceTotals };
export type { Endurance, EnduranceTotals, EnduranceUnit };

const MAX_TARGET = 3600;
const MAX_LAPS = 60;

const DEFAULT_TARGET: Record<EnduranceUnit, number> = { moves: 20, seconds: 600 };

export function defaultEndurance(): Endurance {
  return { unit: "moves", target: DEFAULT_TARGET.moves, laps: [DEFAULT_TARGET.moves] };
}

export function enduranceStep(e: Endurance): number {
  return e.unit === "moves" ? 1 : 15;
}

export function stepEnduranceTarget(climb: ClimbDraft, direction: 1 | -1): ClimbDraft {
  const e = enduranceOf(climb);
  return withEnduranceTarget(climb, e.target + direction * enduranceStep(e));
}

export function stepLap(climb: ClimbDraft, index: number, direction: 1 | -1): ClimbDraft {
  const e = enduranceOf(climb);
  const lap = e.laps[index];
  if (lap === undefined) return climb;
  return withLap(climb, index, lap + direction * enduranceStep(e));
}

/** Coming off starts at the bottom of the series and counts up to where the lap ended. */
export const FELL_AFTER_START = 0;

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
    laps: e.laps.map((lap) => (lap === e.target ? next : Math.min(lap, next))),
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
  if (e.unit === "moves") {
    return t("endurance.amountMoves", { count: value, value: formatNumber(value) });
  }
  const { min, sec } = enduranceTimeParts(value);
  if (min === 0) return t("endurance.amountSec", { value: formatNumber(sec) });
  if (sec === 0) return t("endurance.amountMin", { value: formatNumber(min) });
  return t("endurance.amountMinSec", { min: formatNumber(min), sec: formatNumber(sec) });
}

/** Moves carry the unit once at the end; a time pair carries it on both sides. */
function doneLabel(e: Endurance, value: number): string {
  if (e.unit !== "moves") return enduranceAmountLabel(e, value);
  return formatNumber(value);
}

export function enduranceProgressLabel(e: Endurance): string {
  const { done, total } = enduranceTotals(e);
  return t("endurance.progress", {
    done: doneLabel(e, done),
    amount: enduranceAmountLabel(e, total),
  });
}

/** A lap chip and a lap bar are narrow: a clean lap reads as the amount, a partial as a bare pair. */
export function enduranceLapValueLabel(e: Endurance, index: number): string {
  const lap = e.laps[index] ?? 0;
  if (lap === e.target) return doneLabel(e, lap);
  const bare = (value: number): string =>
    formatNumber(enduranceDisplayValue(e, value), { maximumFractionDigits: 1 });
  return `${bare(lap)}/${bare(e.target)}`;
}

export function enduranceLapLabel(e: Endurance, index: number): string {
  return t("endurance.lapShort", {
    done: doneLabel(e, e.laps[index] ?? 0),
    amount: enduranceAmountLabel(e, e.target),
  });
}

/** A circuit that went the distance reads as what it came to; only a partial lap needs the pair. */
export function enduranceSummaryLabel(e: Endurance): string {
  const { done, laps, clean } = enduranceTotals(e);
  if (clean < laps) return enduranceProgressLabel(e);
  return t("endurance.allClean", { amount: enduranceAmountLabel(e, done) });
}

export function enduranceLapCountLabel(laps: number): string {
  return t("endurance.lapCount", { count: laps });
}

export function enduranceCleanLabel(e: Endurance): string {
  const { laps, clean } = enduranceTotals(e);
  return t("endurance.cleanOf", { clean, laps });
}

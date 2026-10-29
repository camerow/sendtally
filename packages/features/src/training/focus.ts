import { FOCI, type Focus } from "@sendtally/core/hang";
import { t, type MessageKey } from "../i18n";

const LABELS: Record<Focus, MessageKey> = {
  strength: "focus.strength",
  power: "focus.power",
  power_endurance: "focus.powerEndurance",
  endurance: "focus.endurance",
  conditioning: "focus.conditioning",
  skill: "focus.skill",
  recovery: "focus.recovery",
};

const MEANINGS: Record<Focus, MessageKey> = {
  strength: "focus.strengthMeaning",
  power: "focus.powerMeaning",
  power_endurance: "focus.powerEnduranceMeaning",
  endurance: "focus.enduranceMeaning",
  conditioning: "focus.conditioningMeaning",
  skill: "focus.skillMeaning",
  recovery: "focus.recoveryMeaning",
};

/** "Power endurance", or "General" for none. */
export const focusLabel = (focus: Focus | null): string =>
  t(focus === null ? "focus.general" : LABELS[focus]);

/** What a focus trains, in one line. */
export const focusMeaning = (focus: Focus | null): string =>
  t(focus === null ? "focus.generalMeaning" : MEANINGS[focus]);

/** A focus as a route param or chip value, where none is "general". */
export const focusParam = (focus: Focus | null): string => focus ?? "general";

/** The focus a route param names, null for "general", undefined for anything else. */
export const readFocus = (param: string | undefined): Focus | null | undefined =>
  param === "general" ? null : FOCI.find((f) => f === param);

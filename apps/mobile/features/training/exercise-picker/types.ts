import type { Dose } from "@sendtally/core/hang";
import type { DoseMeasure } from "../workout-editor/doseFields";

/**
 * An exercise picked for a workout, as its item names it, how it is measured when it is the
 * user's own or a grip that pulls, and the dose a built-in it came from starts at.
 */
export type Picked = { exercise: string; measure?: DoseMeasure; dose?: Dose };

import type { WorkoutKind } from "@sendtally/core/hang";
import { formatNumber } from "../i18n";

/** Every kind of training, in the order the training mix shows them. */
export const TRAINED_KINDS = [
  "climbing",
  "hangboard",
  "strength",
  "mobility",
  "other",
] as const satisfies readonly WorkoutKind[];

export const oneDecimal = (n: number): string =>
  formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

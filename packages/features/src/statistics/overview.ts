import { formatNumber } from "../i18n";

export const ACTIVITY_KINDS = ["climbing", "hangboard", "strength", "mobility", "other"] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const oneDecimal = (n: number): string =>
  formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

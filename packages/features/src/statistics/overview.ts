import { formatNumber, t, type MessageKey } from "../i18n";

export const ACTIVITY_KINDS = ["climbing", "hangboard", "strength", "mobility", "other"] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

const CLIMBING_ONLY: readonly ActivityKind[] = ["climbing"];

/** Every kind with training on; climbing alone with it off. */
export const shownKinds = (training: boolean): readonly ActivityKind[] =>
  training ? ACTIVITY_KINDS : CLIMBING_ONLY;

const KIND_NAMES: Record<ActivityKind, MessageKey> = {
  climbing: "statistics.climbing",
  hangboard: "statistics.hangboard",
  strength: "activities.kindStrength",
  mobility: "activities.kindMobility",
  other: "activities.kindOther",
};

export const kindName = (kind: ActivityKind): string => t(KIND_NAMES[kind]);

export const oneDecimal = (n: number): string =>
  formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

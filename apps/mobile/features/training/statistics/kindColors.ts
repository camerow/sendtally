import type { ActivityKind as TrainingKind } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { overviewKind, type ActivityKind } from "@sendtally/features/statistics";

/** Validated as a categorical set: gunmetal is the one grey, gold needs the labels it always has. */
export const KIND_COLORS: Record<ActivityKind, string> = {
  climbing: colors.azure,
  hangboard: colors.petalInk,
  strength: colors.fern,
  mobility: colors.gunmetal,
  other: colors.gold,
};

/** A logged activity wears the colour of the overview kind it counts toward. */
export const activityColor = (kind: TrainingKind): string => KIND_COLORS[overviewKind(kind)];

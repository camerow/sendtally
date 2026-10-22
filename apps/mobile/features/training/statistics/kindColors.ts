import { colors } from "@sendtally/design/tokens";
import type { ActivityKind } from "@sendtally/features/statistics";

export const KIND_COLORS: Record<ActivityKind, string> = {
  climbing: colors.azure,
  hangboard: colors.petalInk,
};

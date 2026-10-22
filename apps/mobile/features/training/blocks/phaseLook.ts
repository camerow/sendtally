import type { BlockPhase } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";

/** Build sits quiet, a deload reads as rest, a test week stands out. */
export const PHASE_LOOK: Record<BlockPhase, { ink: string; tint: string; bar: string }> = {
  build: { ink: colors.gunmetal, tint: colors.surfaceSoft, bar: colors.gunmetal },
  deload: { ink: colors.fern, tint: "rgba(21,127,82,0.1)", bar: colors.fern },
  test: { ink: colors.gunmetal, tint: colors.gold, bar: colors.gold },
};

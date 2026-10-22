import type { BlockPhase } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";

/** Load sits quiet, a deload reads as rest, test and perform weeks stand out. */
export const PHASE_LOOK: Record<BlockPhase, { ink: string; tint: string; bar: string }> = {
  load: { ink: colors.gunmetal, tint: colors.surfaceSoft, bar: colors.gunmetal },
  deload: { ink: colors.fern, tint: "rgba(21,127,82,0.1)", bar: colors.fern },
  test: { ink: colors.gunmetal, tint: colors.gold, bar: colors.gold },
  perform: { ink: colors.azureInk, tint: "rgba(27,98,206,0.1)", bar: colors.azureInk },
};

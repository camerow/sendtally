import type { Focus } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";

const FOCUS_COLORS: Record<Focus, string> = {
  strength: colors.gunmetal,
  power: colors.watermelonInk,
  power_endurance: colors.gold,
  endurance: colors.azure,
  conditioning: colors.dataFernSoft,
  skill: colors.petal,
  recovery: colors.dataAzureSoft,
};

/** The one place focus wears colour: the insights mix and its legend. General is the empty grey. */
export const focusColor = (focus: Focus | null): string =>
  focus === null ? colors.dataBarEmpty : FOCUS_COLORS[focus];

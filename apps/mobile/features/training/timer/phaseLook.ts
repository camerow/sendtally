import { colors } from "@sendtally/design/tokens";
import { HANG_ON_DARK, ON_DARK_SOFT, REST_ON_DARK } from "../components/onDark";

/** `mark` draws the ring and bars; `fill` backs the primary button and tints labels, AA with gunmetal ink. */
export type PhaseLook = { mark: string; fill: string };

export function phaseLook(working: boolean, ready: boolean): PhaseLook {
  if (working) return { mark: HANG_ON_DARK, fill: colors.dataAzureSoft };
  if (ready) return { mark: ON_DARK_SOFT, fill: colors.white };
  return { mark: REST_ON_DARK, fill: colors.dataFernSoft };
}

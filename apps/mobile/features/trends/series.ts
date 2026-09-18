import { colors } from "@sendtally/design/tokens";
import type { TrendSeries } from "@sendtally/features/trends";

/** The same palette as the web's trends.css, from the shared tokens. */
export const SERIES_COLOUR: Record<TrendSeries, string> = {
  primary: colors.azure,
  sent: colors.azure,
  notYet: colors.dataAzureSoft,
  worked: colors.azure,
  firstTry: colors.petalInk,
  inside: colors.azure,
  outside: colors.fern,
  clean: colors.fern,
  partial: colors.dataFernSoft,
  boulder: colors.azure,
  route: colors.petalInk,
  effort: colors.petalInk,
};

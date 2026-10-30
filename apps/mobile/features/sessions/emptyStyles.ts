import { colors, fonts } from "@sendtally/design/tokens";

export const emptyLabel = {
  fontFamily: fonts.monoMedium,
  fontSize: 20,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  color: colors.petalInk,
} as const;

export const emptyBody = {
  textAlign: "center",
  fontFamily: fonts.sans,
  fontSize: 14,
  lineHeight: 21,
  color: colors.textSecondary,
} as const;

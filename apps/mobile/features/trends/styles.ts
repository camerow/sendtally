import { colors, fonts, radius } from "@sendtally/design/tokens";

export const monoLabel = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

export const card = {
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.lineOnLightSoft,
  borderRadius: radius.card,
} as const;

import type { TextStyle, ViewStyle } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export const fieldLabel: TextStyle = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
};

export const fieldInput: TextStyle = {
  fontFamily: fonts.sans,
  fontSize: 15,
  color: colors.gunmetal,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: "rgba(64,63,76,0.15)",
  borderRadius: radius.control,
  paddingHorizontal: 13,
  minHeight: 46,
};

export const resultList: ViewStyle = {
  gap: 2,
  padding: 6,
  borderWidth: 1,
  borderColor: "rgba(64,63,76,0.15)",
  borderRadius: radius.control,
};

export const resultRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minHeight: 40,
  paddingHorizontal: 12,
  borderRadius: radius.sm,
};

export const resultName: TextStyle = {
  flexShrink: 1,
  fontFamily: fonts.sansMedium,
  fontSize: 14,
  color: colors.gunmetal,
};

export const resultMeta: TextStyle = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: colors.textMuted,
};

export const actionText: TextStyle = {
  fontFamily: fonts.sansSemiBold,
  fontSize: 14,
  color: colors.azureInk,
};

export const resultPath: TextStyle = {
  fontFamily: fonts.mono,
  fontSize: 11,
  letterSpacing: 0.3,
  color: colors.textSecondary,
};

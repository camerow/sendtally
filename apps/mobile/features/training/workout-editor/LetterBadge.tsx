import React from "react";
import { Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";
import { letterOf } from "./editorState";

const LOOKS = [
  { backgroundColor: colors.gunmetal, color: colors.white },
  { backgroundColor: colors.gold, color: colors.gunmetal },
  { backgroundColor: "rgba(27,98,206,0.12)", color: colors.azureInk },
  { backgroundColor: colors.petalTint, color: colors.petalInk },
] as const;

/** A variation's letter on its own colour, the same in its card and in the pattern. */
export const letterLook = (variation: number): { backgroundColor: string; color: string } =>
  LOOKS[variation % LOOKS.length] ?? LOOKS[0];

export type LetterBadgeProps = { variation: number; size: number };

export function LetterBadge({ variation, size }: LetterBadgeProps): React.ReactElement {
  const { backgroundColor, color } = letterLook(variation);
  return (
    <Text
      style={[
        type.monoBold,
        {
          width: size,
          height: size,
          lineHeight: size,
          borderRadius: size > 32 ? 10 : 8,
          overflow: "hidden",
          textAlign: "center",
          fontSize: size > 32 ? 16 : 14,
          backgroundColor,
          color,
        },
      ]}
    >
      {letterOf(variation)}
    </Text>
  );
}

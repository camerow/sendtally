import React from "react";
import { Text } from "react-native";
import { letterOf } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";

const LOOKS = [
  { backgroundColor: colors.gunmetal, color: colors.white },
  { backgroundColor: colors.gold, color: colors.gunmetal },
  { backgroundColor: "rgba(27,98,206,0.12)", color: colors.azureInk },
  { backgroundColor: colors.petalTint, color: colors.petalInk },
] as const;

/** A dose's letter on its own colour, the same in the editor, the preview and the player. */
const letterLook = (dose: number): { backgroundColor: string; color: string } =>
  LOOKS[dose % LOOKS.length] ?? LOOKS[0];

export type LetterBadgeProps = { dose: number; size: number };

export function LetterBadge({ dose, size }: LetterBadgeProps): React.ReactElement {
  const { backgroundColor, color } = letterLook(dose);
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
      {letterOf(dose)}
    </Text>
  );
}

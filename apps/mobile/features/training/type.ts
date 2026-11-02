import type { TextStyle } from "react-native";
import { fonts } from "@sendtally/design/tokens";

export const type = {
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    textTransform: "uppercase",
  },
  labelSmall: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  mono: { fontFamily: fonts.mono },
  monoBold: { fontFamily: fonts.monoSemiBold },
  display: { fontFamily: fonts.displayHeavy, letterSpacing: -1 },
  body: { fontFamily: fonts.sans },
  bodyBold: { fontFamily: fonts.sansSemiBold },
} satisfies Record<string, TextStyle>;

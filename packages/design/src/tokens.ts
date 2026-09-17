const WATERMELON_INK = "#C4303D";
const PETAL_INK = "#8C1FB5";

export const colors = {
  gunmetal: "#403F4C",
  gunmetalDeep: "#35343F",
  watermelon: "#E84855",
  watermelonPress: "#D63A47",
  watermelonInk: WATERMELON_INK,
  watermelonInkPress: "#A62633",
  gold: "#F9DC5C",
  goldHover: "#FBE583",
  azure: "#3185FC",
  azurePress: "#1F6AD8",
  azureInk: "#1B62CE",
  azureInkPress: "#144EA6",
  petal: "#CC79EA",
  petalTint: "#EED3F8",
  petalInk: PETAL_INK,
  white: "#FFFFFF",
  labelAccent: WATERMELON_INK,
  dataBarPeak: PETAL_INK,
  surfaceSoft: "#F7F6F3",
  textSecondary: "rgba(64,63,76,0.72)",
  textMuted: "rgba(64,63,76,0.55)",
  textFaint: "rgba(64,63,76,0.45)",
  lineOnLight: "rgba(64,63,76,0.1)",
  lineOnLightSoft: "rgba(64,63,76,0.08)",
  lineOnLightStrong: "rgba(64,63,76,0.22)",
  dataBarEmpty: "rgba(64,63,76,0.14)",
} as const;

export const radius = {
  sm: 6,
  control: 10,
  card: 14,
  cardLg: 16,
  panel: 20,
  pill: 20,
} as const;

export const fonts = {
  display: "BricolageGrotesque_700Bold",
  displayHeavy: "BricolageGrotesque_800ExtraBold",
  sans: "IBMPlexSans_400Regular",
  sansMedium: "IBMPlexSans_500Medium",
  sansSemiBold: "IBMPlexSans_600SemiBold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
  monoSemiBold: "IBMPlexMono_600SemiBold",
} as const;

/** One colour per effort level, 1-10: blue for easy through purple to red for all out. */
export const effortScale = [
  "#3186FC",
  "#5482F8",
  "#7C80F3",
  "#AE7DED",
  "#D287D4",
  "#EBBF89",
  "#F7CA59",
  "#F3A358",
  "#EE7658",
  "#E94957",
] as const;

export function effortColor(rpe: number): string {
  const level = Math.min(10, Math.max(1, Math.round(rpe)));
  return effortScale[level - 1] ?? effortScale[0];
}

/** Nothing-hurts green, the zero end of the severity strip. */
export const severityNone = "#29AE70";
export const severityNoneTint = "rgba(41,174,112,0.18)";

/** Severity runs 0-10: green for no pain, then the effort colours. */
export function severityColor(level: number): string {
  return level <= 0 ? severityNone : effortColor(level);
}

import type { ThemeName } from "@sendtally/core/hang";

type Palette = {
  ground: string;
  accent: string;
  rest: string;
  card: string;
  soft: string;
  ink: string;
};

export const PALETTES: Record<ThemeName, Palette> = {
  moss: {
    ground: "#2f3a35",
    accent: "#cdee6a",
    rest: "#9cc2ff",
    card: "#fbfaf5",
    soft: "#edebe1",
    ink: "#26302b",
  },
  dusk: {
    ground: "#262c40",
    accent: "#ff9e6d",
    rest: "#86d8c9",
    card: "#fbfaf7",
    soft: "#eeede8",
    ink: "#232a3d",
  },
  gunmetal: {
    ground: "#403f4c",
    accent: "#f9dc5c",
    rest: "#cc79ea",
    card: "#ffffff",
    soft: "#f1f0ec",
    ink: "#403f4c",
  },
};

export const THEME_ORDER: readonly ThemeName[] = ["moss", "dusk", "gunmetal"];

export type Theme = Palette & {
  deep: string;
  onDark: string;
  onDark2: string;
  onDark3: string;
  lineDark: string;
  ink2: string;
  lineLight: string;
  accentSoft: string;
  restSoft: string;
  scrim: string;
};

export function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channels = [n >> 16, (n >> 8) & 255, n & 255];
  return `#${channels
    .map((c) =>
      Math.round(c * factor)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

const ON_DARK = "#f4f5ef";

export function themeFor(name: ThemeName): Theme {
  const p = PALETTES[name];
  return {
    ...p,
    deep: shade(p.ground, 0.8),
    onDark: ON_DARK,
    onDark2: rgba(ON_DARK, 0.8),
    onDark3: rgba(ON_DARK, 0.64),
    lineDark: rgba(ON_DARK, 0.14),
    ink2: rgba(p.ink, 0.72),
    lineLight: rgba(p.ink, 0.12),
    accentSoft: rgba(p.accent, 0.35),
    restSoft: rgba(p.rest, 0.35),
    scrim: "rgba(12,16,14,0.6)",
  };
}

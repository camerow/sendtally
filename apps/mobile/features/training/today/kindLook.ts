import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { ON_DARK, ON_DARK_SOFT } from "../components/onDark";

export type KindLook = {
  ink: string;
  tint: string;
  onDark: string;
  /** The mark: width, height and corner radii clockwise from top left. */
  shape: MarkShape;
};

export type MarkShape = { width: number; height: number; radii: readonly number[] };

const corners = (tl: number, tr: number, br: number, bl: number): { radii: number[] } => ({
  radii: [tl, tr, br, bl],
});

/** One colour and mark shape per discipline, wherever a day's items show. */
export const KIND_LOOK: Record<WorkoutKind, KindLook> = {
  climbing: {
    ink: colors.azureInk,
    tint: "rgba(27,98,206,0.1)",
    onDark: colors.dataAzureSoft,
    shape: { width: 8, height: 8, ...corners(4, 4, 4, 4) },
  },
  hangboard: {
    ink: colors.petalInk,
    tint: "rgba(140,31,181,0.1)",
    onDark: colors.petal,
    shape: { width: 8, height: 8, ...corners(2, 2, 2, 2) },
  },
  strength: {
    ink: colors.fern,
    tint: "rgba(21,127,82,0.1)",
    onDark: colors.dataFernSoft,
    shape: { width: 11, height: 5, ...corners(0, 0, 0, 0) },
  },
  mobility: {
    ink: colors.gunmetal,
    tint: "rgba(64,63,76,0.1)",
    onDark: ON_DARK,
    shape: { width: 8, height: 8, ...corners(4, 0, 4, 0) },
  },
  other: {
    ink: colors.textSecondary,
    tint: "rgba(64,63,76,0.06)",
    onDark: ON_DARK_SOFT,
    shape: { width: 6, height: 6, ...corners(1, 1, 1, 1) },
  },
};

import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import type { MarkKind } from "@sendtally/features/training";
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
export const KIND_LOOK: Record<MarkKind, KindLook> = {
  climb: {
    ink: colors.azureInk,
    tint: "rgba(27,98,206,0.1)",
    onDark: colors.dataAzureSoft,
    shape: { width: 8, height: 8, ...corners(4, 4, 4, 4) },
  },
  hang: {
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
  run: {
    ink: colors.watermelonInk,
    tint: "rgba(196,48,61,0.1)",
    onDark: colors.watermelon,
    shape: { width: 11, height: 5, ...corners(2.5, 2.5, 2.5, 2.5) },
  },
  yoga: {
    ink: colors.azure,
    tint: "rgba(49,133,252,0.1)",
    onDark: colors.azure,
    shape: { width: 8, height: 8, ...corners(0, 4, 0, 4) },
  },
  other: {
    ink: colors.textSecondary,
    tint: "rgba(64,63,76,0.06)",
    onDark: ON_DARK_SOFT,
    shape: { width: 6, height: 6, ...corners(1, 1, 1, 1) },
  },
};

export function kindName(kind: MarkKind): string {
  return kind === "hang" ? t("training.hangboard") : kindLabel(kind);
}

import type { MenuRowProps } from "../../live-session/MenuRow";

/**
 * One row of a detail screen's ··· sheet; the sheet closes before it runs unless it keeps it open.
 * Its title says what it does: a hint line is only for a status, such as why a post failed.
 */
export type DetailMenuRow = MenuRowProps & { keepOpen?: boolean };

/** Somewhere a thing can be added, checked when it is already there. */
export type AddToOption = { id: string; label: string; detail?: string; there: boolean };

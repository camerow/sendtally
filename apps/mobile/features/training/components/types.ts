import type { MenuRowProps } from "../../live-session/MenuRow";

export type Stat = { label: string; value: string };

/** One row of a detail screen's ··· sheet; the sheet closes before it runs unless it keeps it open. */
export type DetailMenuRow = MenuRowProps & { keepOpen?: boolean };

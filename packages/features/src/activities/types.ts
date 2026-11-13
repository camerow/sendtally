export type Stat = { label: string; value: string };

/** One past session in a history list: what the screen showing it cares about goes in meta. */
export type HistoryItem = {
  id: string;
  date: string;
  name: string;
  meta: string;
  rpe: number | null;
  note?: string | null;
  /** A note with no session behind it, left out of the count. */
  kind?: "note";
  /** The session whose screen this is, on gold and not opened again. */
  current?: boolean;
  /** Off for a row with nothing behind it to open. */
  opens?: boolean;
};

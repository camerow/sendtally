/** One past session in a history list: what the screen showing it cares about goes in meta. */
export type HistoryItem = {
  id: string;
  date: string;
  name: string;
  meta: string;
  rpe: number | null;
  note?: string | null;
  /** The session whose screen this is, on gold and not opened again. */
  current?: boolean;
};

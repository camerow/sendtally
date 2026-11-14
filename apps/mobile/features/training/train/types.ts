import type { ShelfCard as Card } from "@sendtally/features/exercises";

/** One exercise on its category's shelf, with where it opens. */
export type ShelfCard = Card & { open?: () => void };

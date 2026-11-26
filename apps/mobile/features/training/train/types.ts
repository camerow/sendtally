import type { ShelfCard as Card } from "@sendtally/features/exercises";
import type { RowPress } from "../useLockedRows";

/** One exercise on its category's shelf, with how its row presses. */
export type ShelfCard = Card & { press: RowPress };

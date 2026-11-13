import type { Membership } from "@sendtally/core/hang";
import { workoutPath } from "../library/useLibrary";

/** A block's page; `fresh` opens a new one in Edit mode with its name to type. */
export const blockPath = (id: string, { fresh = false } = {}): string =>
  `/app/plan/block/${encodeURIComponent(id)}${fresh ? "?fresh=1" : ""}`;

// ponytail: a workout in a block opens its workout until #290 builds the block workout page.
export const membershipPath = (m: Pick<Membership, "workoutId">): string =>
  workoutPath(m.workoutId);

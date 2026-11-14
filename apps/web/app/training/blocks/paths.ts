import type { Membership } from "@sendtally/core/hang";
import { workoutPath } from "../library/useLibrary";

/** A block's page; `fresh` opens a new one in Edit mode with its name to type. */
export const blockPath = (id: string, { fresh = false } = {}): string =>
  `/app/plan/block/${encodeURIComponent(id)}${fresh ? "?fresh=1" : ""}`;

/** Its weeks inside a block, its workout outside one. */
export const membershipPath = (m: Pick<Membership, "id" | "blockId" | "workoutId">): string =>
  m.blockId === null
    ? workoutPath(m.workoutId)
    : `/app/plan/membership/${encodeURIComponent(m.id)}`;

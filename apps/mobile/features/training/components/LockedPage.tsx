import React from "react";
import type { LockSource } from "@sendtally/features/training";
import { replaceWithMembershipPage } from "../locks";

/** A page whose thing is locked: the Membership page takes its place, from wherever it was opened. */
export function LockedPage({ source }: { source: LockSource }): null {
  React.useEffect(() => replaceWithMembershipPage(source), [source]);
  return null;
}

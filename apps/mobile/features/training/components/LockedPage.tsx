import { router } from "expo-router";
import React from "react";
import type { LockSource } from "@sendtally/features/training";

/** A page whose thing is locked: the Membership page takes its place, from wherever it was opened. */
export function LockedPage({ source }: { source: LockSource }): null {
  React.useEffect(() => router.replace({ pathname: "/membership", params: { source } }), [source]);
  return null;
}

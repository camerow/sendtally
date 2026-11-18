import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import React from "react";
import { draftOwner, onDraftOwnerChange } from "../../lib/userDraftFile";

/**
 * Its children once the signed-in account is known. A player reads its live run and tally from
 * that account's files as it opens; read before, both are empty and it would start over a run.
 */
export function OwnerKnown({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  const owner = React.useSyncExternalStore(onDraftOwnerChange, draftOwner);
  if (isLoaded && !isSignedIn) return <Redirect href="/" />;
  return owner === null ? null : <>{children}</>;
}

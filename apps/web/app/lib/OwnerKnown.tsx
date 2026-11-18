import { useAuth } from "@clerk/react-router";
import React from "react";
import { Navigate } from "react-router";

/**
 * Its children once Clerk knows the signed-in user. A player reads its live run and tally from
 * that user's storage as it opens; read before, both are empty and it would start over a run.
 */
export function OwnerKnown({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const { isLoaded, userId } = useAuth();
  if (isLoaded && !userId) return <Navigate to="/sign-in" replace />;
  return userId ? <>{children}</> : null;
}

import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { useMembership } from "@sendtally/features/billing";
import { useApi } from "../../lib/api";
import { BillingContext } from "./context";
import { signInToStore } from "./store";

function SignedInBilling({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}): React.ReactElement {
  const api = useApi();
  const membership = useMembership(api);

  React.useEffect(() => {
    signInToStore(userId).catch((err: unknown) => {
      console.error(`store sign-in failed: ${err instanceof Error ? err.message : String(err)}`);
    });
  }, [userId]);

  const value = React.useMemo(() => ({ membership }), [membership]);
  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function BillingProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isLoaded, isSignedIn, userId } = useAuth();
  if (!isLoaded || !isSignedIn || userId === undefined || userId === null) {
    return <BillingContext.Provider value={null}>{children}</BillingContext.Provider>;
  }
  return <SignedInBilling userId={userId}>{children}</SignedInBilling>;
}

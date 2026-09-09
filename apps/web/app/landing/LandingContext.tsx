import React from "react";

export type LandingState = { signedIn: boolean };

const LandingContext = React.createContext<LandingState>({ signedIn: false });

export function LandingProvider({
  signedIn,
  children,
}: LandingState & { children: React.ReactNode }): React.ReactElement {
  const value = React.useMemo(() => ({ signedIn }), [signedIn]);
  return <LandingContext.Provider value={value}>{children}</LandingContext.Provider>;
}

export function useLanding(): LandingState {
  return React.useContext(LandingContext);
}

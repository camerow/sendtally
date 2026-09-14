import React from "react";
import type { Locale } from "@sendtally/features/i18n";
import { COPIES } from "./copies";
import { COPY, type LandingCopy } from "./copy";

export type LandingState = { signedIn: boolean; locale: Locale; copy: LandingCopy };

const LandingContext = React.createContext<LandingState>({
  signedIn: false,
  locale: "en",
  copy: COPY,
});

export function LandingProvider({
  signedIn,
  locale,
  children,
}: {
  signedIn: boolean;
  locale: Locale;
  children: React.ReactNode;
}): React.ReactElement {
  const value = React.useMemo(
    () => ({ signedIn, locale, copy: COPIES[locale] }),
    [signedIn, locale]
  );
  return <LandingContext.Provider value={value}>{children}</LandingContext.Provider>;
}

export function useLanding(): LandingState {
  return React.useContext(LandingContext);
}

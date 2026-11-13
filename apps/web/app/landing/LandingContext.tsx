import React from "react";
import type { Locale } from "@sendtally/features/i18n";
import { COPIES } from "./copies";
import { COPY, type LandingCopy } from "./copy";
import type { StorePlatform } from "../lib/stores";

export type LandingState = {
  signedIn: boolean;
  locale: Locale;
  platform: StorePlatform;
  copy: LandingCopy;
};

const LandingContext = React.createContext<LandingState>({
  signedIn: false,
  locale: "en",
  platform: null,
  copy: COPY,
});

export function LandingProvider({
  signedIn,
  locale,
  platform = null,
  children,
}: {
  signedIn: boolean;
  locale: Locale;
  platform?: StorePlatform;
  children: React.ReactNode;
}): React.ReactElement {
  const value = React.useMemo(
    () => ({ signedIn, locale, platform, copy: COPIES[locale] }),
    [signedIn, locale, platform]
  );
  return <LandingContext.Provider value={value}>{children}</LandingContext.Provider>;
}

export function useLanding(): LandingState {
  return React.useContext(LandingContext);
}

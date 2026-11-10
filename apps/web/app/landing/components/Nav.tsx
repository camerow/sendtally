import React from "react";
import { Button, Logo } from "@sendtally/design";
import { landingPath } from "../../lib/seo";
import { useLanding } from "../LandingContext";
import { AccountCta } from "./AccountCta";

export type NavProps = {
  sections?: boolean;
};

export function Nav({ sections = true }: NavProps): React.ReactElement {
  const { signedIn, copy, locale } = useLanding();
  const home = landingPath(locale);
  return (
    <div className="l-nav">
      <a href={home} className="l-nav-logo" aria-label={copy.nav.home}>
        <Logo tone="on-light" size={24} />
      </a>
      <div className="l-nav-links">
        {sections &&
          copy.nav.sections.map((section) => (
            <a key={section.href} href={`${home}${section.href}`} className="l-nav-anchor">
              {section.label}
            </a>
          ))}
        <a href="/pricing" className="l-nav-anchor">
          {copy.nav.pricing}
        </a>
        <div className="l-nav-actions">
          {!signedIn && (
            <a href="/sign-in" className="l-nav-signin">
              {copy.nav.signIn}
            </a>
          )}
          <span className="l-nav-account">
            <AccountCta variant="ghostOnLight" size="sm" label={copy.nav.createAccount} />
          </span>
          <Button variant="azure" size="sm" href={`${home}#start`}>
            {copy.nav.getApp}
          </Button>
        </div>
      </div>
    </div>
  );
}

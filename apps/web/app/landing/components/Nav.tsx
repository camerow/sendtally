import React from "react";
import { Button, Logo } from "@sendtally/design";
import { COPY } from "../copy";
import { useLanding } from "../LandingContext";
import { AccountCta } from "./AccountCta";

export type NavProps = {
  sections?: boolean;
};

export function Nav({ sections = true }: NavProps): React.ReactElement {
  const { signedIn } = useLanding();
  return (
    <div className="l-nav">
      <a href="/" className="l-nav-logo" aria-label="sendtally home">
        <Logo tone="on-light" size={24} />
      </a>
      <div className="l-nav-links">
        {sections &&
          COPY.nav.sections.map((section) => (
            <a key={section.href} href={section.href} className="l-nav-anchor">
              {section.label}
            </a>
          ))}
        <div className="l-nav-actions">
          {!signedIn && (
            <Button variant="ghostOnLight" size="sm" href="/sign-in">
              {COPY.nav.signIn}
            </Button>
          )}
          <AccountCta size="sm" label={COPY.nav.createAccount} />
        </div>
      </div>
    </div>
  );
}

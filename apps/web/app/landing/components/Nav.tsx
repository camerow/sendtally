import React from "react";
import { Button, Logo } from "@sendtally/design";

const SECTIONS: Array<[string, string]> = [
  ["What members see", "#insights"],
  ["Sessions", "#session"],
  ["Strava", "#strava"],
  ["How it works", "#how"],
  ["Membership", "#price"],
];

export function Nav(): React.ReactElement {
  return (
    <div className="l-nav">
      <a href="/" className="l-nav-logo" aria-label="sendtally home">
        <Logo tone="on-light" size={24} />
      </a>
      <div className="l-nav-links">
        {SECTIONS.map(([label, href]) => (
          <a key={label} href={href} className="l-nav-anchor">
            {label}
          </a>
        ))}
        <div className="l-nav-actions">
          <Button variant="ghostOnLight" size="sm" href="/sign-in">
            Sign in
          </Button>
          <Button variant="gold" size="sm" href="/sign-up">
            Create account
          </Button>
        </div>
      </div>
    </div>
  );
}

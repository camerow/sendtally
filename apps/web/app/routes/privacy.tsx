import React from "react";
import type { LinksFunction } from "react-router";
import landingStyles from "../landing/landing.css?url";
import { LegalPage } from "../legal/components/LegalPage";
import legalStyles from "../legal/legal.css?url";
import { PRIVACY } from "../legal/privacy";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: landingStyles },
  { rel: "stylesheet", href: legalStyles },
];

export function meta(): Array<Record<string, string>> {
  return [
    { title: "Privacy policy - sendtally" },
    {
      name: "description",
      content:
        "Everything sendtally stores about you, who processes it, how Strava tokens are encrypted, and how to have all of it deleted the same day.",
    },
  ];
}

export default function Privacy(): React.ReactElement {
  return <LegalPage doc={PRIVACY} />;
}

import React from "react";
import type { LinksFunction } from "react-router";
import landingStyles from "../landing/landing.css?url";
import { LegalPage } from "../legal/components/LegalPage";
import legalStyles from "../legal/legal.css?url";
import { TERMS } from "../legal/terms";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: landingStyles },
  { rel: "stylesheet", href: legalStyles },
];

export function meta(): Array<Record<string, string>> {
  return [
    { title: "Terms of service - sendtally" },
    {
      name: "description",
      content:
        "The terms you agree to when you use sendtally: what the service does, what membership costs, how Strava posting works, and how to leave.",
    },
  ];
}

export default function Terms(): React.ReactElement {
  return <LegalPage doc={TERMS} />;
}

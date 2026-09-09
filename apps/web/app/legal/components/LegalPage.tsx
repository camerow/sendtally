import React from "react";
import type { LinksFunction } from "react-router";
import { Footer } from "../../landing/components/Footer";
import { Nav } from "../../landing/components/Nav";
import landingStyles from "../../landing/landing.css?url";
import legalStyles from "../legal.css?url";

export const legalLinks: LinksFunction = () => [
  { rel: "stylesheet", href: landingStyles },
  { rel: "stylesheet", href: legalStyles },
];

export type LegalPageProps = {
  title: string;
  updated: string;
  lede: string;
  children: React.ReactNode;
};

export function LegalPage({ title, updated, lede, children }: LegalPageProps): React.ReactElement {
  return (
    <div>
      <Nav />
      <main className="l-doc">
        <h1 className="l-doc-title">{title}</h1>
        <span className="l-doc-updated">LAST UPDATED {updated}</span>
        <p className="l-doc-lede">{lede}</p>
        {children}
      </main>
      <Footer />
    </div>
  );
}

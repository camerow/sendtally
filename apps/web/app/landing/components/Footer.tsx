import React from "react";
import { useLanding } from "../LandingContext";
import { AppStores } from "./AppStores";

const LANGUAGES = [
  { label: "English", href: "/" },
  { label: "Deutsch", href: "/de" },
  { label: "Français", href: "/fr" },
  { label: "Español", href: "/es" },
];

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "rgba(64,63,76,0.58)",
  textDecoration: "none",
};

export function Footer(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <div className="l-footer">
      <AppStores />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(64,63,76,0.58)" }}>
        {copy.footer.line}
      </span>
      <div style={{ display: "flex", gap: 22 }}>
        {copy.footer.links.map(({ label, href }) => (
          <a key={label} href={href} style={linkStyle}>
            {label}
          </a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 22 }}>
        {LANGUAGES.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            hrefLang={href === "/" ? "en" : href.slice(1)}
            style={linkStyle}
          >
            {label}
          </a>
        ))}
      </div>
      <p className="l-footer-trademarks">{copy.footer.trademarks}</p>
    </div>
  );
}

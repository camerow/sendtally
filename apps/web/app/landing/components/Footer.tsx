import React from "react";

const LINKS: Array<[string, string]> = [
  ["Sign in", "/sign-in"],
  ["Membership", "https://github.com/sponsors/camerow"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
  ["Contact", "mailto:hello@sendtally.com"],
];

export function Footer(): React.ReactElement {
  return (
    <div className="l-footer">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(64,63,76,0.58)" }}>
        sendtally · not affiliated with Strava
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px" }}>
        {LINKS.map(([label, href]) => (
          <a
            key={label}
            href={href}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "rgba(64,63,76,0.58)",
              textDecoration: "none",
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

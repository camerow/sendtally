import React from "react";
import { COPY } from "../copy";
import { AppStores } from "./AppStores";

export function Footer(): React.ReactElement {
  return (
    <div className="l-footer">
      <AppStores />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(64,63,76,0.58)" }}>
        {COPY.footer.line}
      </span>
      <div style={{ display: "flex", gap: 22 }}>
        {COPY.footer.links.map(({ label, href }) => (
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

import React from "react";
import { useLanding } from "../LandingContext";
import { Label } from "@sendtally/design";
import { AccountCta } from "./AccountCta";
import { Reveal } from "./Reveal";

function Tick(): React.ReactElement {
  return <span className="l-tick" aria-hidden="true" />;
}

export function FreeSection(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <div id="free" className="l-free">
      <div className="l-section-header">
        <Reveal>
          <h2 className="l-section-title" style={{ color: "var(--bs-gunmetal)" }}>
            {copy.free.title}
          </h2>
        </Reveal>
      </div>

      <div className="l-free-grid">
        {copy.free.features.map((f, i) => (
          <Reveal key={f.eyebrow} delay={i * 80} className="l-free-cell">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Label on="accent">{f.eyebrow}</Label>
              <Tick />
            </div>
            <span style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-0.01em" }}>
              {f.title}
            </span>
            <span
              style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-on-white-secondary)" }}
            >
              {f.body}
            </span>
          </Reveal>
        ))}
      </div>

      <Reveal className="l-free-foot">
        <span
          style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "rgba(64,63,76,0.58)" }}
        >
          {copy.free.footnote}
        </span>
        <AccountCta label={copy.free.cta} />
      </Reveal>
    </div>
  );
}

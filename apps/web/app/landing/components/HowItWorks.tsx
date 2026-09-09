import React from "react";
import { Card, Label } from "@sendtally/design";
import { COPY } from "../copy";

export function HowItWorks(): React.ReactElement {
  return (
    <div id="how" className="l-how">
      <div className="l-section-inner">
        <div className="l-section-header">
          <h2 className="l-section-title" style={{ color: "var(--bs-gunmetal)" }}>
            {COPY.how.title}
          </h2>
          <span className="l-section-blurb">{COPY.how.blurb}</span>
        </div>
        <div className="l-card-grid">
          {COPY.how.steps.map((step, i) => (
            <Card
              key={step.title}
              style={{
                background: "var(--surface-soft)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Label on="accent" size={12} style={{ fontWeight: 600, letterSpacing: "0.1em" }}>
                {String(i + 1).padStart(2, "0")}
              </Label>
              <span style={{ fontWeight: 600, fontSize: 19 }}>{step.title}</span>
              <span
                style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-on-white-secondary)" }}
              >
                {step.body}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

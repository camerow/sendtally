import React from "react";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { bodyText, messageText, rowDivider } from "./styles";
import { Switch } from "./Switch";

export type StravaPostingSectionProps = {
  posting: StravaPostingFeature;
};

const rowTitle: React.CSSProperties = { fontWeight: 600, fontSize: 13 };

function Row({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      {children}
    </div>
  );
}

export function StravaPostingSection({ posting }: StravaPostingSectionProps): React.ReactElement {
  return (
    <>
      <div style={rowDivider} />
      <Row>
        <span style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 380 }}>
          <span style={rowTitle}>Post sessions to Strava</span>
          {!posting.enabled && (
            <p style={bodyText}>
              Off. Sessions stay in sendtally, and each one keeps a Post to Strava action on its own
              page.
            </p>
          )}
        </span>
        <Switch
          checked={posting.enabled}
          onChange={posting.setEnabled}
          disabled={posting.busy}
          label="Post sessions to Strava"
        />
      </Row>

      {posting.enabled && (
        <>
          <div style={rowDivider} />
          <Row>
            <span style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 380 }}>
              <span style={rowTitle}>Post sessions logged from</span>
              <p style={bodyText}>Anything earlier stays in sendtally only.</p>
            </span>
            <input
              type="date"
              value={posting.since}
              disabled={posting.busy}
              onChange={(e) => posting.setSince(e.target.value)}
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: "0.04em",
                color: "var(--bs-gunmetal)",
                background: "var(--bs-white)",
                border: "1px solid var(--line-on-light-strong)",
                borderRadius: "var(--radius-control)",
                padding: "9px 12px",
              }}
            />
          </Row>
        </>
      )}

      {posting.error !== null && <span style={messageText}>{posting.error}</span>}
    </>
  );
}

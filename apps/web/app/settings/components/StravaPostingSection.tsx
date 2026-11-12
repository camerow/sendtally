import React from "react";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { bodyText, messageText, rowDivider } from "./styles";
import { SwitchRow } from "./SwitchRow";
import { TrainingStravaRows } from "./TrainingStravaRows";

export type StravaPostingSectionProps = {
  posting: StravaPostingFeature;
};

const dateInput: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 13,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-white)",
  border: "1px solid var(--line-on-light-strong)",
  borderRadius: "var(--radius-control)",
  padding: "0 12px",
  height: 44,
  boxSizing: "border-box",
  flex: 1,
  minWidth: 0,
  maxWidth: 220,
};

const clearButton: React.CSSProperties = {
  width: 44,
  height: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  color: "rgba(64,63,76,0.55)",
  cursor: "pointer",
};

export function StravaPostingSection({ posting }: StravaPostingSectionProps): React.ReactElement {
  return (
    <>
      <SwitchRow
        title={t("settings.postClimbing")}
        body={posting.enabled ? t("settings.postingOn") : t("settings.postingOff")}
        checked={posting.enabled}
        disabled={posting.busy}
        onChange={posting.setEnabled}
      />

      {posting.enabled && (
        <>
          <div style={rowDivider} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t("settings.postSince")}</span>
              <p style={bodyText}>{t("settings.postSinceBody")}</p>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="date"
                aria-label={t("settings.postSince")}
                value={posting.since}
                disabled={posting.busy}
                onChange={(e) => posting.setSince(e.target.value)}
                style={dateInput}
              />
              {posting.since !== "" && (
                <button
                  type="button"
                  aria-label={t("common.clear")}
                  disabled={posting.busy}
                  onClick={() => posting.setSince("")}
                  style={clearButton}
                >
                  <Icon name="x" size={16} />
                </button>
              )}
            </span>
          </div>
        </>
      )}

      <TrainingStravaRows posting={posting} />

      {posting.error !== null && <span style={messageText}>{posting.error}</span>}
    </>
  );
}

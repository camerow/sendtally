import React from "react";
import { DELETE_CONFIRMATION_WORD, type DeleteAccountFeature } from "@sendtally/features/settings";
import { t, upper } from "@sendtally/features/i18n";
import { bodyText, dangerButton, messageText, sectionLabel, underlineButton } from "./styles";

export type DeleteAccountSectionProps = {
  deletion: DeleteAccountFeature;
};

export function DeleteAccountSection({ deletion }: DeleteAccountSectionProps): React.ReactElement {
  const busy = deletion.status === "deleting" || deletion.status === "deleted";
  return (
    <>
      <span style={sectionLabel}>{upper(t("web.account.deleteAccount"))}</span>
      <p style={bodyText}>{t("web.account.deleteBody")}</p>
      {deletion.status === "idle" ? (
        <button type="button" onClick={deletion.open} style={dangerButton}>
          {t("web.account.deleteAccount")}
        </button>
      ) : (
        <>
          <label style={{ ...bodyText, display: "flex", flexDirection: "column", gap: 6 }}>
            {t("web.account.typeToConfirm", { word: DELETE_CONFIRMATION_WORD })}
            <input
              value={deletion.confirmation}
              onChange={(e) => deletion.setConfirmation(e.target.value)}
              disabled={busy}
              autoFocus
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                padding: "10px 12px",
                borderRadius: "var(--radius-control)",
                border: "1px solid var(--line-on-light)",
                maxWidth: 220,
              }}
            />
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={deletion.confirm}
              disabled={!deletion.canConfirm || busy}
              style={{
                ...dangerButton,
                opacity: !deletion.canConfirm || busy ? 0.5 : 1,
                cursor: !deletion.canConfirm || busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? t("web.account.deleting") : t("web.account.deleteMyAccount")}
            </button>
            <button type="button" onClick={deletion.cancel} disabled={busy} style={underlineButton}>
              {t("web.shell.cancel")}
            </button>
          </div>
        </>
      )}
      {deletion.error !== null && <span style={messageText}>{deletion.error}</span>}
    </>
  );
}

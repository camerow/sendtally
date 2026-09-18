import React from "react";
import { Button } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";

export type AreaDialogProps = {
  label: string;
  title?: string;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  /** Contributions to Areas are CC0, so every form that adds to it says so beside the button. */
  licence?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-label-accent)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 22,
  letterSpacing: "-0.02em",
  overflowWrap: "anywhere",
};

export function AreaDialog({
  label,
  title,
  submitLabel,
  busy,
  error,
  licence = false,
  onClose,
  onSubmit,
  children,
}: AreaDialogProps): React.ReactElement {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="project-dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="project-dialog area-dialog-scroll"
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>{label}</span>
          {title !== undefined && <h2 style={titleStyle}>{title}</h2>}
        </div>
        {children}
        {error !== null && (
          <span className="area-error" role="alert">
            {error}
          </span>
        )}
        <div className="area-dialog-footer">
          <span className="area-licence">
            {licence && (
              <>
                {t("areas.licence")}{" "}
                <a href="/terms" target="_blank" rel="noreferrer">
                  {t("areas.licenceTerms")}
                </a>
              </>
            )}
          </span>
          <div className="project-dialog-actions">
            <Button variant="ghostOnLight" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="azure" disabled={busy} onClick={onSubmit}>
              {busy ? t("common.saving") : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router";
import { CONVERSION_PROMPT } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { useCopy } from "../../lib/useCopy";
import { Section } from "../../settings/components/Section";
import { bodyText, linkAction, secondaryButton } from "../../settings/components/styles";
import { code } from "../styles";
import { ServiceLinks } from "./ServiceLinks";
import { sectionLabel } from "../../components/styles";

export function ConversionPrompt({ showApps = false }: { showApps?: boolean }): React.ReactElement {
  const { copied, copy } = useCopy(CONVERSION_PROMPT);
  return (
    <Section>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
      >
        <span style={sectionLabel}>{t("import.convertTitle")}</span>
        <button
          type="button"
          onClick={copy}
          style={{ ...secondaryButton, fontSize: 13, padding: "9px 16px" }}
        >
          {copied ? t("common.copied") : t("import.copyPrompt")}
        </button>
      </div>
      <p style={bodyText}>{t("import.convertHelp")}</p>
      <pre style={{ ...code, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.55 }}>
        {CONVERSION_PROMPT}
      </pre>
      {showApps && (
        <>
          <p style={bodyText}>{t("import.exportSkip")}</p>
          <ServiceLinks />
        </>
      )}
      <Link to="/agents" style={linkAction}>
        {t("import.connectorLine")}
      </Link>
    </Section>
  );
}

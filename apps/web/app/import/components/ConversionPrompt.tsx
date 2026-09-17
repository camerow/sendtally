import React from "react";
import { CONVERSION_PROMPT } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { Section } from "../../settings/components/Section";
import { bodyText, secondaryButton, sectionLabel } from "../../settings/components/styles";
import { code } from "../styles";

export function ConversionPrompt(): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(CONVERSION_PROMPT);
    setCopied(true);
  };
  return (
    <Section>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
      >
        <span style={sectionLabel}>{t("import.convertTitle")}</span>
        <button
          type="button"
          onClick={() => void copy()}
          style={{ ...secondaryButton, fontSize: 13, padding: "9px 16px" }}
        >
          {copied ? t("import.copied") : t("import.copyPrompt")}
        </button>
      </div>
      <p style={bodyText}>{t("import.convertHelp")}</p>
      <pre style={{ ...code, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.55 }}>
        {CONVERSION_PROMPT}
      </pre>
      <p style={bodyText}>{t("import.kayaSkip")}</p>
    </Section>
  );
}

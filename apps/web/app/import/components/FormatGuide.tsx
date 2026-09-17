import React from "react";
import { TEMPLATE_CSV } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { Section } from "../../settings/components/Section";
import {
  bodyText,
  linkAction,
  secondaryButton,
  sectionLabel,
} from "../../settings/components/styles";
import { code, td, tdMono, th } from "../styles";
import { ConversionPrompt } from "./ConversionPrompt";

type Column = {
  name: string;
  required: boolean;
  key:
    | "import.colDate"
    | "import.colSession"
    | "import.colLocation"
    | "import.colGrade"
    | "import.colKind"
    | "import.colStyle"
    | "import.colTriesRpe";
};

const COLUMNS: Column[] = [
  { name: "date", required: true, key: "import.colDate" },
  { name: "session", required: false, key: "import.colSession" },
  { name: "location", required: false, key: "import.colLocation" },
  { name: "grade", required: true, key: "import.colGrade" },
  { name: "kind", required: false, key: "import.colKind" },
  { name: "style", required: false, key: "import.colStyle" },
  { name: "tries, rpe", required: false, key: "import.colTriesRpe" },
];

const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`;

export function FormatGuide(): React.ReactElement {
  const [showPrompt, setShowPrompt] = React.useState(false);
  return (
    <>
      <Section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={sectionLabel}>{t("import.formatLabel")}</span>
          <a href={templateHref} download="sendtally-import-template.csv" style={linkAction}>
            {t("import.downloadTemplate")}
          </a>
        </div>
        <p style={bodyText}>{t("import.formatBody")}</p>
        <pre style={code}>{TEMPLATE_CSV.trimEnd()}</pre>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 110 }}>{t("import.column")}</th>
              <th style={{ ...th, width: 90 }}>{t("import.required")}</th>
              <th style={th}>{t("import.accepted")}</th>
            </tr>
          </thead>
          <tbody>
            {COLUMNS.map((c) => (
              <tr key={c.name}>
                <td style={tdMono}>{c.name}</td>
                <td style={td}>{c.required ? t("import.reqYes") : t("import.reqNo")}</td>
                <td style={td}>{t(c.key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={sectionLabel}>{t("import.convertLabel")}</span>
            <p style={bodyText}>{t("import.convertBody")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            style={{ ...secondaryButton, fontSize: 13, padding: "9px 16px", whiteSpace: "nowrap" }}
          >
            {showPrompt ? t("import.hidePrompt") : t("import.showPrompt")}
          </button>
        </div>
      </Section>
      {showPrompt && <ConversionPrompt />}
    </>
  );
}

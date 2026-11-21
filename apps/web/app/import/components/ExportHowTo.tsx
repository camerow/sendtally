import type React from "react";
import { Label } from "@sendtally/design";
import { exportPageUrl, IMPORT_SERVICES } from "@sendtally/core/import";
import { t } from "@sendtally/features/i18n";
import {
  exportLinkLabel,
  exportSteps,
  stepsText,
  type ImportSource,
} from "@sendtally/features/import";
import { firstRunSourceLabel } from "@sendtally/features/settings";
import { Section } from "../../settings/components/Section";
import { bodyText } from "../../settings/components/styles";
import { Description } from "../../training/components/Description";
import { linkStyle } from "../styles";

/** How to get the file out of the source first run picked: its steps, and a link to its site. */
export function ExportHowTo({ source }: { source: ImportSource }): React.ReactElement {
  if (source === "spreadsheet")
    return (
      <Section>
        <Label on="light">{firstRunSourceLabel(source)}</Label>
        <Description
          text={stepsText([
            t("import.howToSpreadsheet1"),
            t("import.howToSpreadsheet2"),
            t("import.howToSpreadsheet3"),
          ])}
        />
        <p style={{ ...bodyText, fontSize: 12.5 }}>{t("import.howToSpreadsheetAi")}</p>
      </Section>
    );
  const steps = exportSteps(source);
  return (
    <Section>
      <Label on="light">{IMPORT_SERVICES[source]}</Label>
      {steps.length > 0 && <Description text={stepsText(steps)} />}
      <a href={exportPageUrl(source)} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        {exportLinkLabel(source)} <span aria-hidden="true">↗</span>
      </a>
    </Section>
  );
}

import type React from "react";
import { Label } from "@sendtally/design";
import { exportPageUrl, IMPORT_SERVICES } from "@sendtally/core/import";
import {
  exportLinkLabel,
  exportSteps,
  stepsText,
  type ExportService,
} from "@sendtally/features/import";
import { Section } from "../../settings/components/Section";
import { Description } from "../../training/components/Description";

/** How to get the file out of the service first run picked, with a link to its site. */
export function ExportHowTo({ service }: { service: ExportService }): React.ReactElement {
  const name = IMPORT_SERVICES[service];
  const url = exportPageUrl(service);
  const steps = exportSteps(service);
  return (
    <Section>
      <Label on="light">{name}</Label>
      {steps.length > 0 && <Description text={stepsText(steps)} />}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          alignSelf: "flex-start",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--bs-azure-ink)",
        }}
      >
        {exportLinkLabel(service, url, name)} <span aria-hidden="true">↗</span>
      </a>
    </Section>
  );
}

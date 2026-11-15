import type React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { sectionLabel } from "../../components/styles";
import { Section } from "../../settings/components/Section";
import { bodyText } from "../../settings/components/styles";
import { linkStyle } from "../styles";

/** Importing through an AI app connected to sendtally, as the Agents page sets up. */
export function AssistantCard(): React.ReactElement {
  return (
    <Section>
      <span style={sectionLabel}>{t("import.assistantTitle")}</span>
      <p style={bodyText}>{t("import.assistantBody")}</p>
      <Link to="/agents" style={linkStyle}>
        sendtally.com/agents
      </Link>
    </Section>
  );
}

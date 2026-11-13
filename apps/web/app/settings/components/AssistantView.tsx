import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { BackLink } from "../../components/BackLink";
import { sectionLabel } from "../../components/styles";
import { code } from "../../import/styles";
import { bodyText, linkAction, monoMuted, pageTitle, secondaryButton } from "./styles";
import { Section } from "./Section";

export function AssistantView({ url }: { url: string }): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };
  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
      <BackLink to="/app/settings">{t("common.settings")}</BackLink>
      <h1 style={pageTitle}>{t("settings.assistant")}</h1>

      <Section>
        <p style={bodyText}>{t("settings.assistantBody")}</p>
        <span style={sectionLabel}>{t("settings.assistantUrl")}</span>
        <pre style={{ ...code, margin: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
          {url}
        </pre>
        <button type="button" onClick={() => void copy()} style={secondaryButton}>
          {copied ? t("settings.copied") : t("settings.copyUrl")}
        </button>
      </Section>

      <Section>
        <span style={sectionLabel}>Claude</span>
        <p style={bodyText}>{t("settings.assistantClaude")}</p>
      </Section>

      <Section>
        <span style={sectionLabel}>ChatGPT</span>
        <p style={bodyText}>{t("settings.assistantChatgpt")}</p>
        <span style={monoMuted}>{t("settings.assistantUntested")}</span>
      </Section>

      <p style={bodyText}>{t("settings.assistantRevoke")}</p>
      <Link to="/ai-assistants" style={linkAction}>
        {t("settings.assistantLearnMore")}
      </Link>
    </div>
  );
}

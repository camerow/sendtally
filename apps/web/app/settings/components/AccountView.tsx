import React from "react";
import type { DeleteAccountFeature } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { BackLink } from "../../components/BackLink";
import { bodyText, pageTitle, sectionLabel, secondaryButton } from "./styles";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { Section } from "./Section";

export type AccountViewProps = {
  email: string;
  deletion: DeleteAccountFeature;
  onSignOut: () => void;
};

export function AccountView({ email, deletion, onSignOut }: AccountViewProps): React.ReactElement {
  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
      <BackLink to="/app/settings">{t("common.settings")}</BackLink>
      <h1 style={pageTitle}>{t("common.account")}</h1>

      <Section>
        <span style={sectionLabel}>{t("account.signedInAs")}</span>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{email}</span>
        <p style={bodyText}>{t("account.codeSignIn")}</p>
        <button type="button" onClick={onSignOut} style={secondaryButton}>
          {t("common.signOut")}
        </button>
      </Section>

      <Section>
        <DeleteAccountSection deletion={deletion} />
      </Section>
    </div>
  );
}

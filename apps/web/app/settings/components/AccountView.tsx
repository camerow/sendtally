import React from "react";
import type { DeleteAccountFeature } from "@sendtally/features/settings";
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
      <BackLink to="/app/settings">SETTINGS</BackLink>
      <h1 style={pageTitle}>Account</h1>

      <Section>
        <span style={sectionLabel}>SIGNED IN AS</span>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{email}</span>
        <p style={bodyText}>
          We sign you in with a code sent to this address. There is no password to store.
        </p>
        <button type="button" onClick={onSignOut} style={secondaryButton}>
          Sign out
        </button>
      </Section>

      <Section>
        <DeleteAccountSection deletion={deletion} />
      </Section>
    </div>
  );
}

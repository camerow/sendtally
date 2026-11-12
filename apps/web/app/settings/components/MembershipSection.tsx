import React from "react";
import { Link } from "react-router";
import { membershipSummary, type MembershipVM } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { monoMuted, sectionLabel } from "../../components/styles";
import { ChevronRow } from "./ChevronRow";
import { bodyText, rowDivider } from "./styles";

export type MembershipSectionProps = {
  membership: MembershipVM;
};

export function MembershipSection({ membership }: MembershipSectionProps): React.ReactElement {
  return (
    <>
      <span style={sectionLabel}>{t("common.membership")}</span>
      <span style={monoMuted}>
        {membership.renewalLine === null
          ? membership.statusLabel
          : `${membership.statusLabel} · ${membership.renewalLine}`}
      </span>
      <p style={bodyText}>{membershipSummary(membership)}</p>
      <div style={rowDivider} />
      <Link
        to="/app/membership"
        style={{
          fontWeight: 600,
          fontSize: 13,
          color: "var(--bs-gunmetal)",
          textDecoration: "none",
        }}
      >
        <ChevronRow>
          {membership.active ? t("settings.manageMembership") : t("settings.seePlans")}
        </ChevronRow>
      </Link>
    </>
  );
}

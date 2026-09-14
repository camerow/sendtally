import React from "react";
import { Link } from "react-router";
import { memberPoints, storeName, type MembershipVM } from "@sendtally/features/billing";
import { t, upper } from "@sendtally/features/i18n";
import { ChevronRow } from "./ChevronRow";
import { bodyText, monoMuted, rowDivider, sectionLabel } from "./styles";
import { StatusPill } from "./StatusPill";

export type MembershipSectionProps = {
  membership: MembershipVM;
};

export function MembershipSection({ membership }: MembershipSectionProps): React.ReactElement {
  const store = membership.managedIn;
  const line = !membership.active
    ? t("web.settings.membershipPitch")
    : store === "play_store" || store === "app_store"
      ? t("web.settings.billedThrough", { store: storeName(store) })
      : null;
  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
      >
        <span style={sectionLabel}>{upper(t("web.settings.membership"))}</span>
        <StatusPill label={membership.statusLabel} active={membership.active} />
      </div>
      {membership.renewalLine !== null && (
        <span style={monoMuted}>{upper(membership.renewalLine)}</span>
      )}
      {line !== null && <p style={bodyText}>{line}</p>}
      {!membership.active && (
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            ...bodyText,
          }}
        >
          {memberPoints().map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
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
          {membership.active ? t("web.settings.manageMembership") : t("web.settings.seePlans")}
        </ChevronRow>
      </Link>
    </>
  );
}

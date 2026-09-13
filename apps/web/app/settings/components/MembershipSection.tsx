import React from "react";
import { Link } from "react-router";
import { MEMBER_POINTS, storeName, type MembershipVM } from "@sendtally/features/billing";
import { ChevronRow } from "./ChevronRow";
import { bodyText, monoMuted, rowDivider, sectionLabel } from "./styles";
import { StatusPill } from "./StatusPill";

export type MembershipSectionProps = {
  membership: MembershipVM;
};

export function MembershipSection({ membership }: MembershipSectionProps): React.ReactElement {
  const store = membership.managedIn;
  const line = !membership.active
    ? "A membership unlocks trends and insights in your climbing habits."
    : store === "play_store" || store === "app_store"
      ? `Billed through ${storeName(store)}. Manage it there.`
      : null;
  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
      >
        <span style={sectionLabel}>MEMBERSHIP</span>
        <StatusPill label={membership.statusLabel} active={membership.active} />
      </div>
      {membership.renewalLine !== null && (
        <span style={monoMuted}>{membership.renewalLine.toUpperCase()}</span>
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
          {MEMBER_POINTS.map((point) => (
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
        <ChevronRow>{membership.active ? "Manage membership" : "See plans"}</ChevronRow>
      </Link>
    </>
  );
}

import React from "react";
import { Link } from "react-router";
import { MEMBER_POINTS, storeName, type MembershipVM } from "@sendtally/features/billing";
import { Icon } from "../../components/Icon";
import { bodyText, monoMuted, rowDivider, sectionLabel } from "./styles";
import { StatusPill } from "./StatusPill";

export type MembershipSectionProps = {
  membership: MembershipVM;
};

function summary(vm: MembershipVM): string | null {
  if (!vm.active) return "A membership unlocks trends and insights in your climbing habits.";
  if (vm.managedIn === "play_store" || vm.managedIn === "app_store") {
    return `Billed through ${storeName(vm.managedIn)}. Manage it there.`;
  }
  return null;
}

export function MembershipSection({ membership }: MembershipSectionProps): React.ReactElement {
  const line = summary(membership);
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          minHeight: 44,
          fontWeight: 600,
          fontSize: 13,
          color: "var(--bs-gunmetal)",
          textDecoration: "none",
        }}
      >
        {membership.active ? "Manage membership" : "See plans"}
        <span style={{ display: "flex", color: "rgba(64,63,76,0.45)" }}>
          <Icon name="chevron" size={16} />
        </span>
      </Link>
    </>
  );
}

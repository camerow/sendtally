import React from "react";
import { Label } from "@sendtally/design";
import { storeName, type MembershipVM } from "@sendtally/features/billing";

export type StoreMembershipPanelProps = {
  vm: MembershipVM;
};

const MANAGE_URLS: Partial<Record<NonNullable<MembershipVM["managedIn"]>, string>> = {
  play_store: "https://play.google.com/store/account/subscriptions",
  app_store: "https://apps.apple.com/account/subscriptions",
};

export function StoreMembershipPanel({ vm }: StoreMembershipPanelProps): React.ReactElement {
  const managedIn = vm.managedIn ?? "other";
  const manageUrl = MANAGE_URLS[managedIn];
  const where = storeName(managedIn);
  return (
    <div
      style={{
        border: "1px solid var(--line-on-light-soft)",
        borderRadius: "var(--radius-card)",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 620,
      }}
    >
      <Label on="accent">{vm.statusLabel}</Label>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, textWrap: "pretty" }}>
        {manageUrl === undefined
          ? "Your membership is active on this account."
          : `Your membership is billed through ${where}. Change or cancel it from your ${where} subscriptions; the trends stay until the paid period ends.`}
      </p>
      {vm.renewalLine !== null && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.06em",
            color: "var(--text-on-white-secondary)",
          }}
        >
          {vm.renewalLine.toUpperCase()}
        </span>
      )}
      {manageUrl !== undefined && (
        <a
          href={manageUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--bs-white)",
            background: "var(--bs-azure-ink)",
            borderRadius: "var(--radius-control)",
            padding: "14px 22px",
            textDecoration: "none",
            alignSelf: "flex-start",
          }}
        >
          {`Manage in ${where.replace("the ", "")} →`}
        </a>
      )}
    </div>
  );
}

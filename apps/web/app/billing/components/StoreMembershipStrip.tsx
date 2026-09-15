import React from "react";
import { storeChipName, type MembershipVM } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { panelGhostButton, panelMono } from "./MembershipPanel";

const MANAGE_URLS: Partial<Record<NonNullable<MembershipVM["managedIn"]>, string>> = {
  play_store: "https://play.google.com/store/account/subscriptions",
  app_store: "https://apps.apple.com/account/subscriptions",
};

/** The store-member strip: the renewal line, and the store's own subscription page. */
export function StoreMembershipStrip({ vm }: { vm: MembershipVM }): React.ReactElement {
  const managedIn = vm.managedIn ?? "other";
  const manageUrl = MANAGE_URLS[managedIn];
  return (
    <>
      <span style={panelMono}>{vm.renewalLine ?? vm.statusLabel}</span>
      {manageUrl !== undefined && (
        <a href={manageUrl} target="_blank" rel="noreferrer" style={panelGhostButton}>
          {t("billing.manageIn", { store: storeChipName(managedIn) })} →
        </a>
      )}
    </>
  );
}

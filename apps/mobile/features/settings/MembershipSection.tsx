import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import type { MembershipVM } from "@sendtally/features/billing";
import { STORE_NAME, subscriptionManagementUrl } from "../billing/store";
import type { PurchaseFeature } from "../billing/usePurchase";
import {
  bodyText,
  chipButton,
  chipButtonLabel,
  messageText,
  monoMuted,
  sectionLabel,
  underlineLabel,
  underlinePress,
} from "./styles";

export type MembershipSectionProps = {
  membership: MembershipVM;
  purchase: PurchaseFeature;
};

function openManagement(): void {
  void subscriptionManagementUrl().then((url) => Linking.openURL(url));
}

export function MembershipSection({
  membership,
  purchase,
}: MembershipSectionProps): React.ReactElement {
  const restoring = purchase.status === "restoring";
  const inStore = membership.managedIn === "play_store" || membership.managedIn === "app_store";
  return (
    <View style={{ gap: 12 }}>
      <Text style={sectionLabel}>MEMBERSHIP</Text>
      <Text style={monoMuted}>
        {membership.renewalLine === null
          ? membership.statusLabel
          : `${membership.statusLabel} · ${membership.renewalLine.toUpperCase()}`}
      </Text>
      {inStore && (
        <>
          <Text style={bodyText}>
            {`Membership is billed through ${STORE_NAME}. Change or cancel it from your ${STORE_NAME} subscriptions; the trends stay until the paid period ends.`}
          </Text>
          <Pressable onPress={openManagement} style={{ ...chipButton, alignSelf: "flex-start" }}>
            <Text style={chipButtonLabel}>Manage subscription</Text>
          </Pressable>
        </>
      )}
      {membership.managedIn === "web" && (
        <Text style={bodyText}>Membership is billed on sendtally.com and managed there.</Text>
      )}
      {membership.managedIn === "other" && (
        <Text style={bodyText}>Membership is active on this account.</Text>
      )}
      {!membership.active && (
        <>
          <Text style={bodyText}>
            Membership unlocks the trends screens. Join from the Trends tab, or restore a membership
            you already pay for on this {STORE_NAME} account.
          </Text>
          <Pressable onPress={purchase.restore} disabled={restoring} style={underlinePress}>
            <Text style={{ ...underlineLabel, fontSize: 12 }}>
              {restoring ? "Restoring…" : "Restore purchases"}
            </Text>
          </Pressable>
        </>
      )}
      {purchase.error !== null && <Text style={messageText}>{purchase.error}</Text>}
    </View>
  );
}

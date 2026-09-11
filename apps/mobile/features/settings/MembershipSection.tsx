import React from "react";
import { Text, View } from "react-native";
import { planLabel, storeName, type MembershipVM } from "@sendtally/features/billing";
import { LinkRow } from "../../components/LinkRow";
import { bodyText, monoMuted, sectionLabel } from "../../lib/styles";

export type MembershipSectionProps = {
  membership: MembershipVM;
  onOpen: () => void;
};

function summary(vm: MembershipVM): string {
  if (!vm.active) return "Logging is free. Membership adds the trends.";
  if (vm.managedIn === "play_store" || vm.managedIn === "app_store") {
    const plan = vm.plan === null ? "Membership" : planLabel(vm.plan);
    return `${plan}, billed through ${storeName(vm.managedIn)}.`;
  }
  if (vm.managedIn === "web") return "Bought on sendtally.com. It unlocks the trends here too.";
  return "Membership is active on this account.";
}

export function MembershipSection({
  membership,
  onOpen,
}: MembershipSectionProps): React.ReactElement {
  return (
    <View style={{ gap: 12 }}>
      <Text style={sectionLabel}>MEMBERSHIP</Text>
      <Text style={monoMuted}>
        {membership.renewalLine === null
          ? membership.statusLabel
          : `${membership.statusLabel} · ${membership.renewalLine.toUpperCase()}`}
      </Text>
      <Text style={bodyText}>{summary(membership)}</Text>
      <LinkRow label={membership.active ? "Manage membership" : "See plans"} onPress={onOpen} />
    </View>
  );
}

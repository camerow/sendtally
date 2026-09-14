import { t, upper } from "@sendtally/features/i18n";
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
  if (!vm.active) return t("mobile.settings.membershipFree");
  if (vm.managedIn === "play_store" || vm.managedIn === "app_store") {
    const plan = vm.plan === null ? t("mobile.settings.membershipDefaultPlan") : planLabel(vm.plan);
    return t("mobile.settings.membershipStore", { plan, store: storeName(vm.managedIn) });
  }
  if (vm.managedIn === "web") return t("mobile.settings.membershipWeb");
  return t("mobile.settings.membershipActive");
}

export function MembershipSection({
  membership,
  onOpen,
}: MembershipSectionProps): React.ReactElement {
  return (
    <View style={{ gap: 12 }}>
      <Text style={sectionLabel}>{upper(t("mobile.settings.membership"))}</Text>
      <Text style={monoMuted}>
        {membership.renewalLine === null
          ? membership.statusLabel
          : `${membership.statusLabel} · ${upper(membership.renewalLine)}`}
      </Text>
      <Text style={bodyText}>{summary(membership)}</Text>
      <LinkRow
        label={
          membership.active ? t("mobile.settings.manageMembership") : t("mobile.settings.seePlans")
        }
        onPress={onOpen}
      />
    </View>
  );
}

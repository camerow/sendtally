import { t } from "@sendtally/features/i18n";
import React from "react";
import { Text, View } from "react-native";
import { membershipSummary, type MembershipVM } from "@sendtally/features/billing";
import { LinkRow } from "../../components/LinkRow";
import { bodyText, monoMuted, sectionLabel } from "../../lib/styles";

export type MembershipSectionProps = {
  membership: MembershipVM;
  onOpen: () => void;
};

export function MembershipSection({
  membership,
  onOpen,
}: MembershipSectionProps): React.ReactElement {
  return (
    <View style={{ gap: 12 }}>
      <Text style={sectionLabel}>{t("common.membership")}</Text>
      <Text style={monoMuted}>
        {membership.renewalLine === null
          ? membership.statusLabel
          : `${membership.statusLabel} · ${membership.renewalLine}`}
      </Text>
      <Text style={bodyText}>{membershipSummary(membership)}</Text>
      <LinkRow
        label={membership.active ? t("settings.manageMembership") : t("settings.seePlans")}
        onPress={onOpen}
      />
    </View>
  );
}

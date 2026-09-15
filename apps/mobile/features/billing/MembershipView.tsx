import React from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  membershipPanel,
  storeChipName,
  type MembershipFeature,
  type MembershipVM,
} from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import {
  bodyText,
  chipButton,
  chipButtonLabel,
  sectionLabel,
  underlineLabel,
  underlinePress,
} from "../../lib/styles";
import { MembershipPanel, panelMono, panelNote } from "./MembershipPanel";
import { PurchaseControls } from "./PurchaseControls";
import { storeBillingAvailable, storeLabel, subscriptionManagementUrl } from "./store";
import type { PurchaseFeature } from "./usePurchase";
import { press } from "../../lib/press";

export type MembershipViewProps = {
  membership: MembershipFeature;
  purchase: PurchaseFeature;
  onBack: () => void;
};

function openManagement(): void {
  void subscriptionManagementUrl().then((url) => Linking.openURL(url));
}

function RestoreLink({ purchase }: { purchase: PurchaseFeature }): React.ReactElement {
  const restoring = purchase.status === "restoring";
  return (
    <Pressable onPress={purchase.restore} disabled={restoring} style={underlinePress}>
      <Text style={{ ...underlineLabel, fontSize: 12 }}>
        {restoring ? t("billing.restoring") : t("billing.restorePurchases")}
      </Text>
    </Pressable>
  );
}

function Panel({
  vm,
  purchase,
}: {
  vm: MembershipVM;
  purchase: PurchaseFeature;
}): React.ReactElement {
  const panel = membershipPanel();
  if (!vm.active) {
    return (
      <MembershipPanel eyebrow={panel.eyebrow} title={panel.pageTitle}>
        <PurchaseControls purchase={purchase} />
      </MembershipPanel>
    );
  }
  const eyebrow = t("billing.memberVia", { store: storeChipName(vm.managedIn ?? "other") });
  if (vm.managedIn === "web") {
    return (
      <MembershipPanel eyebrow={eyebrow} title={t("billing.trendsOpen")} linkRows>
        <Text style={panelMono}>{t("billing.renewsOnWeb")}</Text>
        <Text style={panelNote}>{t("billing.webBody")}</Text>
      </MembershipPanel>
    );
  }
  const inStore = vm.managedIn === "play_store" || vm.managedIn === "app_store";
  return (
    <MembershipPanel eyebrow={eyebrow} title={t("billing.trendsOpen")} linkRows>
      {vm.renewalLine !== null && <Text style={panelMono}>{vm.renewalLine}</Text>}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {inStore && (
          <Pressable
            onPress={openManagement}
            accessibilityRole="button"
            style={press({ ...chipButton, alignSelf: "flex-start" })}
          >
            <Text style={chipButtonLabel}>
              {t("billing.manageIn", { store: storeChipName(vm.managedIn ?? "other") })}
            </Text>
          </Pressable>
        )}
        <RestoreLink purchase={purchase} />
      </View>
    </MembershipPanel>
  );
}

/** A web member can move billing to the store; the plans sit under the panel as their own section. */
function SwitchToStore({ purchase }: { purchase: PurchaseFeature }): React.ReactElement | null {
  if (!storeBillingAvailable) return null;
  return (
    <View style={{ gap: 12 }}>
      <Text style={sectionLabel}>{t("billing.payThroughInstead", { store: storeLabel() })}</Text>
      <Text style={bodyText}>{t("billing.switchBody", { store: storeLabel() })}</Text>
      <PurchaseControls purchase={purchase} />
    </View>
  );
}

function MemberBadge(): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: colors.petalTint,
        borderRadius: radius.sm,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.monoSemiBold,
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.petalInk,
        }}
      >
        {t("common.member")}
      </Text>
    </View>
  );
}

export function MembershipView({
  membership,
  purchase,
  onBack,
}: MembershipViewProps): React.ReactElement {
  const { state, vm } = membership;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        <Pressable onPress={onBack} style={press({ minHeight: 44, justifyContent: "center" })}>
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.labelAccent,
            }}
          >
            {t("common.backToSettings")}
          </Text>
        </Pressable>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 32,
                letterSpacing: -1,
                color: colors.gunmetal,
              }}
            >
              {t("common.membership")}
            </Text>
            {vm.active && <MemberBadge />}
          </View>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              lineHeight: 21,
              color: colors.textSecondary,
            }}
          >
            {t("billing.introMobile")}
          </Text>
        </View>

        {state.status === "loading" && (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        )}
        {state.status === "error" && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
              {t("billing.loadFailed")}
            </Text>
            <Pressable onPress={membership.reload} style={underlinePress}>
              <Text style={{ ...underlineLabel, fontSize: 12 }}>{t("common.tryAgain")}</Text>
            </Pressable>
          </View>
        )}
        {state.status === "ready" && (
          <>
            <Panel vm={vm} purchase={purchase} />
            {vm.active && vm.managedIn === "web" && <SwitchToStore purchase={purchase} />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

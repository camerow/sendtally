import React from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  planLabel,
  storeName,
  type MembershipFeature,
  type MembershipVM,
} from "@sendtally/features/billing";
import { t, upper } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import {
  bodyText,
  chipButton,
  chipButtonLabel,
  sectionLabel,
  underlineLabel,
  underlinePress,
} from "../../lib/styles";
import { memberSlides } from "../onboarding/slides";
import { OnboardingCarousel } from "../onboarding/OnboardingCarousel";
import { MembershipStatusCard } from "./MembershipStatusCard";
import { PurchaseControls } from "./PurchaseControls";
import { storeBillingAvailable, storeLabel, subscriptionManagementUrl } from "./store";
import type { PurchaseFeature } from "./usePurchase";
import { press } from "../../lib/press";

export type MembershipViewProps = {
  membership: MembershipFeature;
  purchase: PurchaseFeature;
  onBack: () => void;
};

const inStore = (vm: MembershipVM): boolean =>
  vm.managedIn === "play_store" || vm.managedIn === "app_store";

function openManagement(): void {
  void subscriptionManagementUrl().then((url) => Linking.openURL(url));
}

function StatusCard({
  vm,
  purchase,
}: {
  vm: MembershipVM;
  purchase: PurchaseFeature;
}): React.ReactElement {
  const restoring = purchase.status === "restoring";
  const restoreLink = (
    <Pressable onPress={purchase.restore} disabled={restoring} style={underlinePress}>
      <Text style={{ ...underlineLabel, fontSize: 12 }}>
        {restoring ? t("mobile.billing.restoring") : t("mobile.billing.restorePurchases")}
      </Text>
    </Pressable>
  );

  if (!vm.active) {
    return (
      <MembershipStatusCard
        active={false}
        label={vm.statusLabel}
        headline={t("mobile.billing.loggingIsFree")}
        detail={null}
        body={`${t("mobile.billing.freeBody")}${storeBillingAvailable ? t("mobile.billing.pickAPlan") : ""}`}
      />
    );
  }

  if (inStore(vm) && vm.managedIn !== null) {
    const where = storeName(vm.managedIn);
    return (
      <MembershipStatusCard
        active
        label={vm.statusLabel}
        headline={vm.plan === null ? t("mobile.billing.membership") : planLabel(vm.plan)}
        detail={vm.renewalLine}
        body={t("mobile.billing.storeBody", { store: where })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Pressable
            onPress={openManagement}
            accessibilityRole="button"
            style={press({ ...chipButton, alignSelf: "flex-start" })}
          >
            <Text style={chipButtonLabel}>
              {t("mobile.billing.manageIn", { store: where.replace("the ", "") })}
            </Text>
          </Pressable>
          {restoreLink}
        </View>
      </MembershipStatusCard>
    );
  }

  if (vm.managedIn === "web") {
    return (
      <MembershipStatusCard
        active
        label={vm.statusLabel}
        headline={t("mobile.billing.membership")}
        detail={null}
        body={t("mobile.billing.webBody")}
      />
    );
  }

  return (
    <MembershipStatusCard
      active
      label={vm.statusLabel}
      headline={vm.plan === null ? t("mobile.billing.membership") : planLabel(vm.plan)}
      detail={vm.renewalLine}
      body={t("mobile.billing.activeBody")}
    >
      {restoreLink}
    </MembershipStatusCard>
  );
}

function PlansSection({
  vm,
  purchase,
}: {
  vm: MembershipVM;
  purchase: PurchaseFeature;
}): React.ReactElement | null {
  if (!storeBillingAvailable) return null;
  if (vm.active && vm.managedIn !== "web") return null;
  const switching = vm.active;
  return (
    <View style={{ gap: 12 }}>
      <Text style={sectionLabel}>
        {upper(
          switching
            ? t("mobile.billing.payThroughInstead", { store: storeLabel() })
            : t("mobile.billing.plans")
        )}
      </Text>
      {switching && (
        <Text style={bodyText}>{t("mobile.billing.switchBody", { store: storeLabel() })}</Text>
      )}
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
          color: colors.petalInk,
        }}
      >
        {upper(t("mobile.billing.member"))}
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
              color: colors.watermelonInk,
            }}
          >
            {upper(t("mobile.billing.backToSettings"))}
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
              {t("mobile.billing.membership")}
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
            {t("mobile.billing.intro")}
          </Text>
        </View>

        <View style={{ marginHorizontal: -18 }}>
          <OnboardingCarousel slides={memberSlides()} fill={false} />
        </View>

        {state.status === "loading" && (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        )}
        {state.status === "error" && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
              {t("mobile.billing.loadFailed")}
            </Text>
            <Pressable onPress={membership.reload} style={underlinePress}>
              <Text style={{ ...underlineLabel, fontSize: 12 }}>{t("mobile.common.tryAgain")}</Text>
            </Pressable>
          </View>
        )}
        {state.status === "ready" && (
          <>
            <StatusCard vm={vm} purchase={purchase} />
            <PlansSection vm={vm} purchase={purchase} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

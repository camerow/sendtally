import React from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MEMBER_BENEFITS,
  planLabel,
  storeName,
  type MembershipFeature,
  type MembershipVM,
} from "@sendtally/features/billing";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import {
  bodyText,
  chipButton,
  chipButtonLabel,
  sectionLabel,
  underlineLabel,
  underlinePress,
} from "../../lib/styles";
import { MembershipStatusCard } from "./MembershipStatusCard";
import { PurchaseControls } from "./PurchaseControls";
import { STORE_NAME, storeBillingAvailable, subscriptionManagementUrl } from "./store";
import type { PurchaseFeature } from "./usePurchase";

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
        {restoring ? "Restoring…" : "Restore purchases"}
      </Text>
    </Pressable>
  );

  if (!vm.active) {
    return (
      <MembershipStatusCard
        active={false}
        label={vm.statusLabel}
        headline="Logging is free"
        detail={null}
        body={`Membership is what turns the log into a training history, and it is what pays for the server.${storeBillingAvailable ? " Pick a plan below to join." : ""}`}
      />
    );
  }

  if (inStore(vm) && vm.managedIn !== null) {
    const where = storeName(vm.managedIn);
    return (
      <MembershipStatusCard
        active
        label={vm.statusLabel}
        headline={vm.plan === null ? "Membership" : planLabel(vm.plan)}
        detail={vm.renewalLine}
        body={`Billed through ${where}. Change plan or cancel from your ${where} subscriptions; the trends stay until the paid period ends.`}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Pressable
            onPress={openManagement}
            accessibilityRole="button"
            style={{ ...chipButton, alignSelf: "flex-start" }}
          >
            <Text style={chipButtonLabel}>{`Manage in ${where.replace("the ", "")}`}</Text>
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
        headline="Membership"
        detail={null}
        body="This membership was bought on sendtally.com and renews there. It unlocks the trends in the app all the same."
      />
    );
  }

  return (
    <MembershipStatusCard
      active
      label={vm.statusLabel}
      headline={vm.plan === null ? "Membership" : planLabel(vm.plan)}
      detail={vm.renewalLine}
      body="Membership is active on this account."
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
        {switching ? `PAY THROUGH ${STORE_NAME.toUpperCase()} INSTEAD` : "PLANS"}
      </Text>
      {switching && (
        <Text style={bodyText}>
          {`Subscribe here to bill membership through ${STORE_NAME}. Cancel the sendtally.com plan afterwards so you are not paying twice.`}
        </Text>
      )}
      <PurchaseControls purchase={purchase} />
    </View>
  );
}

function Benefits(): React.ReactElement {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ ...sectionLabel, paddingBottom: 4 }}>WHAT MEMBERS GET</Text>
      {MEMBER_BENEFITS.map((benefit) => (
        <View
          key={benefit.title}
          style={{
            gap: 4,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.lineOnLight,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
              {benefit.title}
            </Text>
            {benefit.soon === true && (
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 9,
                  letterSpacing: 0.6,
                  color: colors.watermelonInk,
                }}
              >
                COMING SOON
              </Text>
            )}
          </View>
          <Text style={bodyText}>{benefit.body}</Text>
        </View>
      ))}
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
        MEMBER
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
        <Pressable onPress={onBack} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 12,
              letterSpacing: 0.5,
              color: colors.watermelonInk,
            }}
          >
            ← SETTINGS
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
              Membership
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
            Logging sessions and posting them to Strava are free and always will be. Membership
            unlocks the screens that read your whole history back to you.
          </Text>
        </View>

        {state.status === "loading" && (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        )}
        {state.status === "error" && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
              Could not load your membership.
            </Text>
            <Pressable onPress={membership.reload} style={underlinePress}>
              <Text style={{ ...underlineLabel, fontSize: 12 }}>Try again</Text>
            </Pressable>
          </View>
        )}
        {state.status === "ready" && (
          <>
            <StatusCard vm={vm} purchase={purchase} />
            <Benefits />
            <PlansSection vm={vm} purchase={purchase} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

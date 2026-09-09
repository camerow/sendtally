import React from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import type { Entitlements } from "@sendtally/api-client";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { WEB_URL } from "../../lib/config";
import { packageLabel, STORE_NAME } from "./store";
import { UpgradeCard, type UpgradeCardProps } from "./UpgradeCard";
import { useBilling } from "./useBilling";
import { usePurchase, type PurchaseFeature } from "./usePurchase";

export type PaywallProps = Omit<UpgradeCardProps, "children">;

const legalLink = {
  fontFamily: fonts.mono,
  fontSize: 11,
  letterSpacing: 0.6,
  color: colors.gunmetal,
  textDecorationLine: "underline" as const,
};

function PurchaseControls({ purchase }: { purchase: PurchaseFeature }): React.ReactElement {
  const busy = purchase.status === "purchasing" || purchase.status === "restoring";
  return (
    <View style={{ gap: 10, paddingTop: 6 }}>
      {purchase.packages.map((pkg) => (
        <Pressable
          key={pkg.identifier}
          onPress={() => purchase.purchase(pkg)}
          disabled={busy}
          style={{
            backgroundColor: colors.azureInk,
            borderRadius: radius.control,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {purchase.status === "purchasing" ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
              {`Become a member · ${packageLabel(pkg)}`}
            </Text>
          )}
        </Pressable>
      ))}
      <Text
        style={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.gunmetal }}
      >
        {`Billed through ${STORE_NAME}. Renews automatically until you cancel, which you can do any time from your ${STORE_NAME} subscriptions.`}
      </Text>
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Pressable
          onPress={purchase.restore}
          disabled={busy}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={legalLink}>
            {purchase.status === "restoring" ? "Restoring…" : "Restore purchases"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(`${WEB_URL}/terms`)}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={legalLink}>Terms</Text>
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(`${WEB_URL}/privacy`)}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={legalLink}>Privacy</Text>
        </Pressable>
      </View>
      {purchase.error !== null && (
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            lineHeight: 17,
            color: colors.watermelonInk,
          }}
        >
          {purchase.error}
        </Text>
      )}
    </View>
  );
}

function StorePaywall({
  refresh,
  ...card
}: PaywallProps & { refresh: () => Promise<Entitlements> }): React.ReactElement {
  const purchase = usePurchase(refresh);
  return (
    <UpgradeCard {...card}>
      {purchase.status === "loading" && (
        <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
      )}
      {purchase.status !== "loading" && purchase.status !== "unavailable" && (
        <PurchaseControls purchase={purchase} />
      )}
    </UpgradeCard>
  );
}

export function Paywall(props: PaywallProps): React.ReactElement {
  const billing = useBilling();
  if (billing === null) return <UpgradeCard {...props} />;
  return <StorePaywall {...props} refresh={billing.membership.refresh} />;
}

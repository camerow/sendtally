import React from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { WEB_URL } from "../../lib/config";
import { PlanPicker } from "./PlanPicker";
import { defaultPackage, packageLabel, STORE_NAME, storeBillingAvailable } from "./store";
import type { PurchaseFeature } from "./usePurchase";

export type PurchaseControlsProps = {
  purchase: PurchaseFeature;
};

const legalLink = {
  fontFamily: fonts.mono,
  fontSize: 11,
  letterSpacing: 0.6,
  color: colors.gunmetal,
  textDecorationLine: "underline" as const,
};

function LegalLink({ label, onPress }: { label: string; onPress: () => void }): React.ReactElement {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 44, justifyContent: "center" }}>
      <Text style={legalLink}>{label}</Text>
    </Pressable>
  );
}

export function PurchaseControls({ purchase }: PurchaseControlsProps): React.ReactElement | null {
  const busy = purchase.status === "purchasing" || purchase.status === "restoring";
  const [chosen, setChosen] = React.useState<PurchasesPackage | null>(null);
  const selected = chosen ?? defaultPackage(purchase.packages);

  if (!storeBillingAvailable) return null;
  if (purchase.status === "loading") {
    return <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />;
  }

  return (
    <View style={{ gap: 12 }}>
      {purchase.status === "unavailable" ? (
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.gunmetal }}
        >
          {`Plans could not be loaded from ${STORE_NAME} right now. Check your connection and reopen the app to try again.`}
        </Text>
      ) : (
        <>
          <PlanPicker
            packages={purchase.packages}
            selected={selected}
            disabled={busy}
            onSelect={setChosen}
          />
          <Pressable
            onPress={() => selected !== null && purchase.purchase(selected)}
            disabled={busy || selected === null}
            accessibilityRole="button"
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
                {selected === null
                  ? "Become a member"
                  : `Become a member · ${packageLabel(selected)}`}
              </Text>
            )}
          </Pressable>
          <Text
            style={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.gunmetal }}
          >
            {`Billed through ${STORE_NAME}. Renews automatically until you cancel, which you can do any time from your ${STORE_NAME} subscriptions.`}
          </Text>
        </>
      )}
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
        <LegalLink label="Terms" onPress={() => void Linking.openURL(`${WEB_URL}/terms`)} />
        <LegalLink label="Privacy" onPress={() => void Linking.openURL(`${WEB_URL}/privacy`)} />
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

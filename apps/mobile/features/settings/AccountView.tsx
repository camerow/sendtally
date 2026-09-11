import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DeleteAccountFeature } from "@sendtally/features/settings";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";
import { DeleteAccountSection } from "./DeleteAccountSection";

export type AccountViewProps = {
  email: string;
  version: string;
  deletion: DeleteAccountFeature;
  onBack: () => void;
  onSignOut: () => void;
};

export function AccountView({
  email,
  version,
  deletion,
  onBack,
  onSignOut,
}: AccountViewProps): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 32,
          gap: 14,
        }}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          style={press({ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" })}
        >
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

        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 32,
            letterSpacing: -1,
            color: colors.gunmetal,
          }}
        >
          Account
        </Text>

        <View style={sectionCard}>
          <Text style={sectionLabel}>SIGNED IN AS</Text>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
            {email}
          </Text>
          <Text style={bodyText}>
            We sign you in with a code sent to this address. There is no password to store.
          </Text>
          <Pressable
            onPress={onSignOut}
            accessibilityRole="button"
            style={press({
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.control,
              borderWidth: 1,
              borderColor: colors.lineOnLightStrong,
              backgroundColor: colors.white,
            })}
          >
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
              Sign out
            </Text>
          </Pressable>
        </View>

        <DeleteAccountSection deletion={deletion} />

        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.6,
            color: colors.textFaint,
          }}
        >
          {version}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

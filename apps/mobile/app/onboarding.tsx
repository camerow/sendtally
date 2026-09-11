import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Logo } from "../components/Logo";
import { SignedOutOnly } from "../features/auth/SignedOutOnly";
import { OnboardingCarousel } from "../features/onboarding/OnboardingCarousel";
import { press } from "../lib/press";

export default function Onboarding(): React.ReactElement | null {
  return (
    <SignedOutOnly>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ flex: 1, paddingTop: 20, paddingBottom: 12, gap: 20 }}>
          <View style={{ paddingHorizontal: 22 }}>
            <Logo size={24} />
          </View>

          <OnboardingCarousel />

          <View style={{ paddingHorizontal: 22, gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/sign-in?intent=sign-up")}
              style={press({
                backgroundColor: colors.gold,
                borderRadius: radius.control,
                paddingVertical: 14,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Text
                style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.gunmetal }}
              >
                Create account
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/sign-in?intent=sign-in")}
              style={press({
                backgroundColor: colors.white,
                borderRadius: radius.control,
                borderWidth: 1,
                borderColor: colors.lineOnLightStrong,
                paddingVertical: 14,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Text
                style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.gunmetal }}
              >
                Sign in
              </Text>
            </Pressable>
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 12,
                lineHeight: 19,
                textAlign: "center",
                color: colors.textMuted,
              }}
            >
              Free to log · one-time code sign-in · no password
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </SignedOutOnly>
  );
}

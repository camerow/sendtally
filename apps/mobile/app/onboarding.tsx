import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { Logo } from "../components/Logo";
import { SignedOutOnly } from "../features/auth/SignedOutOnly";
import { OnboardingCarousel } from "../features/onboarding/OnboardingCarousel";
import { Button } from "../features/training/components/Button";

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
            <Button
              label={t("common.createAccount")}
              onPress={() => router.push("/sign-in?intent=sign-up")}
              variant="primary"
            />
            <Button
              label={t("common.signIn")}
              onPress={() => router.push("/sign-in?intent=sign-in")}
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    </SignedOutOnly>
  );
}

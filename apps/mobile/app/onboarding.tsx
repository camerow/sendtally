import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { Logo } from "../components/Logo";
import { SignedOutOnly } from "../features/auth/SignedOutOnly";
import { WelcomeCard } from "../features/onboarding/WelcomeCard";
import { Button } from "../features/training/components/Button";
import { Label } from "../features/training/components/Label";
import { Title } from "../features/training/components/Title";

export default function Onboarding(): React.ReactElement | null {
  return (
    <SignedOutOnly>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ flex: 1, paddingTop: 20, paddingBottom: 12, gap: 20 }}>
          <View style={{ paddingHorizontal: 22 }}>
            <Logo size={24} />
          </View>

          <View style={{ flex: 1, justifyContent: "center", gap: 22, paddingHorizontal: 22 }}>
            <WelcomeCard />
            <View style={{ gap: 10 }}>
              <Label color={colors.gunmetal}>{t("onboarding.intro.eyebrow")}</Label>
              <Title size={27}>{t("onboarding.setup.welcomeTitle")}</Title>
            </View>
          </View>

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

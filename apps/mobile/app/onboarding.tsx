import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { Logo } from "../components/Logo";
import { SignedOutOnly } from "../features/auth/SignedOutOnly";
import { WelcomeCarousel } from "../features/onboarding/WelcomeCarousel";
import { Button } from "../features/training/components/Button";
import { Title } from "../features/training/components/Title";
import { type } from "../features/training/type";

const line = [
  type.bodyBold,
  { paddingHorizontal: 22, fontSize: 15, lineHeight: 20, color: colors.gunmetal },
];

export default function Onboarding(): React.ReactElement | null {
  return (
    <SignedOutOnly>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={{ flex: 1, paddingTop: 20, paddingBottom: 12, gap: 20 }}>
          <View style={{ paddingHorizontal: 22 }}>
            <Logo size={24} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            alwaysBounceVertical={false}
            contentContainerStyle={{ flexGrow: 1, gap: 14 }}
          >
            <View style={{ paddingHorizontal: 22 }}>
              <Title size={27}>{t("onboarding.intro.title")}</Title>
            </View>
            <WelcomeCarousel />
            <Text style={line}>{t("onboarding.intro.line")}</Text>
          </ScrollView>

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

import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { Logo } from "../components/Logo";
import { SignedOutOnly } from "../features/auth/SignedOutOnly";
import { WelcomeCard } from "../features/onboarding/WelcomeCard";
import { Button } from "../features/training/components/Button";
import { Title } from "../features/training/components/Title";
import { type } from "../features/training/type";

const body = [type.body, { fontSize: 15, lineHeight: 22, color: colors.gunmetal }];

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
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              gap: 22,
              paddingHorizontal: 22,
            }}
          >
            <WelcomeCard />
            <View style={{ gap: 10 }}>
              <Title size={27}>{t("onboarding.intro.title")}</Title>
              <Text style={body}>{t("onboarding.intro.body")}</Text>
              <Text style={body}>{t("onboarding.intro.why")}</Text>
            </View>
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

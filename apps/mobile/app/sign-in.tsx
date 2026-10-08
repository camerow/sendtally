import * as AppleAuthentication from "expo-apple-authentication";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleMark, useSignInFlow } from "@sendtally/auth-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Logo } from "../components/Logo";
import { SignedOutOnly } from "../features/auth/SignedOutOnly";
import { press } from "../lib/press";

export default function SignIn(): React.ReactElement | null {
  const params = useLocalSearchParams<{ intent?: string }>();
  const router = useRouter();
  const flow = useSignInFlow({
    intent: params.intent === "sign-up" ? "sign-up" : "sign-in",
    onSignedIn: () => router.replace("/(tabs)/sessions"),
  });
  const { phase, busy, error, copy, swap } = flow;
  const inCodePhase = phase.name === "code";
  const inPasswordPhase = phase.name === "password";
  const fieldStyle = {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.gunmetal,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: "rgba(64,63,76,0.12)",
    borderRadius: radius.control,
    paddingHorizontal: 15,
    paddingVertical: 13,
    minHeight: 44,
  };
  const secondaryLink = {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: "rgba(64,63,76,0.6)",
    textDecorationLine: "underline" as const,
  };

  return (
    <SignedOutOnly>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 32, gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              {router.canGoBack() && (
                <Pressable
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  accessibilityLabel={t("auth.back")}
                  hitSlop={12}
                  style={{ minHeight: 32, justifyContent: "center" }}
                >
                  <Text
                    style={{ fontFamily: fonts.sansMedium, fontSize: 20, color: colors.textMuted }}
                  >
                    ←
                  </Text>
                </Pressable>
              )}
              <Logo size={24} />
            </View>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 32,
                letterSpacing: -1,
                color: colors.gunmetal,
                marginTop: 6,
              }}
            >
              {copy.title}
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                lineHeight: 21,
                color: colors.textSecondary,
              }}
            >
              {copy.body}
            </Text>
            {inPasswordPhase && (
              <TextInput
                value={flow.password}
                onChangeText={flow.setPassword}
                placeholder={t("auth.passwordLabel")}
                placeholderTextColor={colors.textFaint}
                secureTextEntry
                textContentType="password"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={() => void flow.signInWithPassword()}
                style={fieldStyle}
              />
            )}
            {inCodePhase && (
              <TextInput
                value={flow.code}
                onChangeText={flow.setCode}
                placeholder="123456"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoFocus
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 18,
                  letterSpacing: 6,
                  color: colors.gunmetal,
                  backgroundColor: colors.surfaceSoft,
                  borderWidth: 1,
                  borderColor: "rgba(64,63,76,0.12)",
                  borderRadius: radius.control,
                  paddingHorizontal: 15,
                  paddingVertical: 13,
                  minHeight: 48,
                }}
              />
            )}
            {phase.name === "email" && (
              <>
                {Platform.OS === "ios" && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={radius.control}
                    onPress={() => void (busy ? undefined : flow.continueWithApple())}
                    style={{ height: 48, opacity: busy ? 0.45 : 1 }}
                  />
                )}
                <Pressable
                  onPress={() => void flow.continueWithGoogle()}
                  disabled={busy}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: "rgba(64,63,76,0.18)",
                    borderRadius: radius.control,
                    paddingVertical: 13,
                    minHeight: 48,
                    opacity: busy ? 0.45 : 1,
                  }}
                >
                  <GoogleMark />
                  <Text
                    style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.gunmetal }}
                  >
                    {t("auth.continueWithGoogle")}
                  </Text>
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: "rgba(64,63,76,0.12)" }} />
                  <Text
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 11,
                      color: colors.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    {" "}
                    {t("auth.or")}
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: "rgba(64,63,76,0.12)" }} />
                </View>
              </>
            )}
            {phase.name === "email" && (
              <TextInput
                value={flow.email}
                onChangeText={flow.setEmail}
                placeholder="you@email.com"
                placeholderTextColor={colors.textFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={fieldStyle}
              />
            )}
            {error !== null && (
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
                {error}
              </Text>
            )}
            <Pressable
              onPress={() => void flow.submit()}
              disabled={busy}
              style={{
                backgroundColor: colors.azureInk,
                borderRadius: radius.control,
                paddingVertical: 14,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                opacity: busy ? 0.45 : 1,
              }}
            >
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.white }}>
                {copy.submitLabel}
              </Text>
            </Pressable>
            {phase.name !== "email" && (
              <View style={{ flexDirection: "row", gap: 22 }}>
                <Pressable
                  onPress={flow.backToEmail}
                  style={press({ minHeight: 44, justifyContent: "center" })}
                >
                  <Text style={secondaryLink}>{t("auth.differentEmail")}</Text>
                </Pressable>
                {inCodePhase && (
                  <Pressable
                    onPress={() => void flow.resendCode()}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Text style={secondaryLink}>{t("auth.resend")}</Text>
                  </Pressable>
                )}
                {flow.canSendEmailCodeInstead && (
                  <Pressable
                    onPress={() => void flow.sendEmailCodeInstead()}
                    disabled={busy}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Text style={secondaryLink}>{t("auth.emailMeACode")}</Text>
                  </Pressable>
                )}
              </View>
            )}
            {phase.name === "email" && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted }}>
                  {swap.prompt}
                </Text>
                <Pressable
                  onPress={() => router.setParams({ intent: swap.to })}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 12,
                      color: colors.azureInk,
                      textDecorationLine: "underline",
                    }}
                  >
                    {swap.label}
                  </Text>
                </Pressable>
              </View>
            )}
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 12,
                lineHeight: 19,
                color: "rgba(64,63,76,0.58)",
              }}
            >
              {t("auth.stravaNote")}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SignedOutOnly>
  );
}

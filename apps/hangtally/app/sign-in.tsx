import { useAuth } from "@clerk/clerk-expo";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignInFlow } from "@sendtally/auth-native";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { Mark } from "../components/Mark";
import { Title } from "../components/Title";
import { AuthInput } from "../features/auth/AuthInput";
import { SocialSignIn } from "../features/auth/SocialSignIn";
import { TextLink } from "../features/auth/TextLink";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";

function SignInForm(): React.ReactElement {
  const c = useTheme();
  const params = useLocalSearchParams<{ intent?: string }>();
  const router = useRouter();
  const flow = useSignInFlow({
    intent: params.intent === "sign-up" ? "sign-up" : "sign-in",
    onSignedIn: () => router.replace("/"),
  });
  const { phase, busy, error, copy, swap } = flow;
  const onEmail = phase.name === "email";

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 32, paddingBottom: 32, gap: 16 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Mark size={30} plate={c.accent} ink={c.ground} />
        <Text style={[type.monoBold, { fontSize: 18, color: c.onDark }]}>{t("hang.appName")}</Text>
      </View>
      {onEmail && (
        <Title size={38} color={c.onDark} style={{ marginTop: 18 }}>
          {t("hang.signInTitle")}
        </Title>
      )}
      <Text style={[type.bodyBold, { fontSize: 20, color: c.onDark }]}>{copy.title}</Text>
      <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: c.onDark2 }]}>
        {onEmail ? t("hang.signInBody") : copy.body}
      </Text>
      {phase.name === "password" && (
        <AuthInput
          value={flow.password}
          onChangeText={flow.setPassword}
          placeholder={t("auth.passwordLabel")}
          secureTextEntry
          textContentType="password"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          onSubmitEditing={() => void flow.signInWithPassword()}
        />
      )}
      {phase.name === "code" && (
        <AuthInput
          value={flow.code}
          onChangeText={flow.setCode}
          placeholder="123456"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoFocus
          style={[type.mono, { fontSize: 18, letterSpacing: 6 }]}
        />
      )}
      {onEmail && <SocialSignIn flow={flow} />}
      {onEmail && (
        <AuthInput
          value={flow.email}
          onChangeText={flow.setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
      {error !== null && <Text style={[type.mono, { fontSize: 12, color: c.rest }]}>{error}</Text>}
      <Button
        label={copy.submitLabel}
        onPress={() => void flow.submit()}
        variant="accent"
        height={52}
        disabled={busy}
      />
      {!onEmail && (
        <View style={{ flexDirection: "row", gap: 22 }}>
          <TextLink label={t("auth.differentEmail")} onPress={flow.backToEmail} color={c.onDark3} />
          {phase.name === "code" && (
            <TextLink
              label={t("auth.resend")}
              onPress={() => void flow.resendCode()}
              color={c.onDark3}
            />
          )}
          {flow.canSendEmailCodeInstead && (
            <TextLink
              label={t("auth.emailMeACode")}
              onPress={() => void flow.sendEmailCodeInstead()}
              color={c.onDark3}
              disabled={busy}
            />
          )}
        </View>
      )}
      {onEmail && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Text style={[type.mono, { fontSize: 12, color: c.onDark3 }]}>{swap.prompt}</Text>
          <TextLink
            label={swap.label}
            onPress={() => router.setParams({ intent: swap.to })}
            color={c.accent}
          />
        </View>
      )}
    </ScrollView>
  );
}

export default function SignIn(): React.ReactElement | null {
  const c = useTheme();
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ground }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <SignInForm />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

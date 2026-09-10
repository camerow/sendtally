import { useClerk, useSSO, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { makeRedirectUri } from "expo-auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Logo } from "../components/Logo";
import { SignedOutOnly } from "../features/auth/SignedOutOnly";

WebBrowser.maybeCompleteAuthSession();

type Intent = "sign-in" | "sign-up";

function GoogleMark(): React.ReactElement {
  return (
    <Svg width={17} height={17} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.55c0-1.64-.15-3.22-.42-4.73H24v8.95h11.83c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.57-9.47 6.57-16.38z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}

// The password phase only ever appears for accounts that carry a password,
// which Clerk reports per user. Store reviewers get one; nobody else does.
type Phase = { name: "email" } | { name: "code"; mode: Intent } | { name: "password" };

const SWAP: Record<Intent, { to: Intent; prompt: string; label: string }> = {
  "sign-in": { to: "sign-up", prompt: "First time here?", label: "Create an account" },
  "sign-up": { to: "sign-in", prompt: "Already have an account?", label: "Sign in" },
};

const COPY: Record<Intent, { title: string; body: string }> = {
  "sign-in": {
    title: "Welcome back.",
    body: "No password. Enter the email you signed up with and we send a one-time code.",
  },
  "sign-up": {
    title: "Create your account.",
    body: "No password. We email you a one-time code. Logging sessions and Strava sync are free.",
  },
};

function errorMessage(err: unknown): string {
  const first = (err as { errors?: Array<{ longMessage?: string; message?: string }> }).errors?.[0];
  return first?.longMessage ?? first?.message ?? "Something went wrong. Try again.";
}

function errorCode(err: unknown): string | undefined {
  return (err as { errors?: Array<{ code?: string }> }).errors?.[0]?.code;
}

export default function SignIn(): React.ReactElement | null {
  const params = useLocalSearchParams<{ intent?: string }>();
  const intent: Intent = params.intent === "sign-up" ? "sign-up" : "sign-in";
  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const clerk = useClerk();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>({ name: "email" });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function continueWithGoogle(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: makeRedirectUri(),
      });
      if (result.createdSessionId !== undefined && result.setActive !== undefined) {
        await result.setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/sessions");
        return;
      }
      setError("Google sign-in didn't complete. Try again.");
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  async function sendCode(): Promise<void> {
    if (!signInLoaded || !signUpLoaded) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: email });
      if (attempt.supportedFirstFactors?.some((f) => f.strategy === "password")) {
        setPhase({ name: "password" });
        setBusy(false);
        return;
      }
      const factor = attempt.supportedFirstFactors?.find((f) => f.strategy === "email_code");
      if (factor === undefined || !("emailAddressId" in factor)) {
        setError("Email code sign-in is not enabled for this account.");
        setBusy(false);
        return;
      }
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: factor.emailAddressId,
      });
      setPhase({ name: "code", mode: "sign-in" });
    } catch (signInErr) {
      if (errorCode(signInErr) !== "form_identifier_not_found") {
        setError(errorMessage(signInErr));
        setBusy(false);
        return;
      }
      if (intent === "sign-in") {
        setError("No account for that email yet. Check the address, or create an account below.");
        setBusy(false);
        return;
      }
      try {
        await signUp.create({ emailAddress: email });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPhase({ name: "code", mode: "sign-up" });
      } catch (signUpErr) {
        setError(errorMessage(signUpErr));
      }
    }
    setBusy(false);
  }

  async function verifyCode(): Promise<void> {
    if (!signInLoaded || !signUpLoaded || phase.name !== "code") return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the six-digit code from the email.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (phase.mode === "sign-in") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: code.trim(),
        });
        if (result.status === "complete" && setActive !== undefined) {
          await setActive({ session: result.createdSessionId });
          router.replace("/(tabs)/sessions");
          return;
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (result.status === "complete" && result.createdSessionId !== null) {
          await clerk.setActive({ session: result.createdSessionId });
          router.replace("/(tabs)/sessions");
          return;
        }
      }
      setError("That code didn't verify. Try again or resend.");
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  async function signInWithPassword(): Promise<void> {
    if (!signInLoaded || phase.name !== "password") return;
    if (password === "") {
      setError("Enter your password.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await signIn.attemptFirstFactor({ strategy: "password", password });
      if (result.status === "complete" && setActive !== undefined) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/sessions");
        return;
      }
      setError("That password didn't work. Try again.");
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  function backToEmail(): void {
    setPhase({ name: "email" });
    setCode("");
    setPassword("");
    setError(null);
  }

  const inCodePhase = phase.name === "code";
  const inPasswordPhase = phase.name === "password";
  const copy = COPY[intent];
  const swap = SWAP[intent];
  const title = inCodePhase ? "Check your inbox." : inPasswordPhase ? "Welcome back." : copy.title;
  const body = inCodePhase
    ? `We sent a six-digit code to ${email}.`
    : inPasswordPhase
      ? `Enter the password for ${email}.`
      : copy.body;
  const buttonLabel = inCodePhase
    ? phase.name === "code" && phase.mode === "sign-up"
      ? "Create account"
      : "Sign in"
    : inPasswordPhase
      ? "Sign in"
      : "Email me a code";
  const submit = inCodePhase ? verifyCode : inPasswordPhase ? signInWithPassword : sendCode;
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
                  accessibilityLabel="Back"
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
              {title}
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                lineHeight: 21,
                color: colors.textSecondary,
              }}
            >
              {body}
            </Text>
            {inPasswordPhase && (
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError(null);
                }}
                placeholder="Password"
                placeholderTextColor={colors.textFaint}
                secureTextEntry
                textContentType="password"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={() => void signInWithPassword()}
                style={fieldStyle}
              />
            )}
            {inCodePhase && (
              <TextInput
                value={code}
                onChangeText={(t) => {
                  setCode(t);
                  setError(null);
                }}
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
                <Pressable
                  onPress={() => void continueWithGoogle()}
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
                    Continue with Google
                  </Text>
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: "rgba(64,63,76,0.12)" }} />
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
                    OR
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: "rgba(64,63,76,0.12)" }} />
                </View>
              </>
            )}
            {phase.name === "email" && (
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError(null);
                }}
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
              onPress={() => void submit()}
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
                {buttonLabel}
              </Text>
            </Pressable>
            {phase.name !== "email" && (
              <View style={{ flexDirection: "row", gap: 22 }}>
                <Pressable
                  onPress={backToEmail}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text style={secondaryLink}>Different email</Text>
                </Pressable>
                {inCodePhase && (
                  <Pressable
                    onPress={() => void sendCode()}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Text style={secondaryLink}>Resend</Text>
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
              Strava linking happens on the web. Log sessions here or at sendtally.com - same
              account, same logbook.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SignedOutOnly>
  );
}

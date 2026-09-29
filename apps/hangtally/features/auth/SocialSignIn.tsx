import * as AppleAuthentication from "expo-apple-authentication";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { GoogleMark, type SignInFlow } from "@sendtally/auth-native";
import { t } from "@sendtally/features/i18n";
import { press } from "../../lib/press";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { Label } from "../../components/Label";

export function SocialSignIn({ flow }: { flow: SignInFlow }): React.ReactElement {
  const c = useTheme();
  const { busy } = flow;
  return (
    <>
      {Platform.OS === "ios" && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={12}
          onPress={() => void (busy ? undefined : flow.continueWithApple())}
          style={{ height: 50, opacity: busy ? 0.45 : 1 }}
        />
      )}
      <Pressable
        onPress={() => void flow.continueWithGoogle()}
        disabled={busy}
        accessibilityRole="button"
        style={press({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          backgroundColor: c.card,
          borderRadius: 12,
          minHeight: 50,
          opacity: busy ? 0.45 : 1,
        })}
      >
        <GoogleMark />
        <Text style={[type.bodyBold, { fontSize: 16, color: c.ink }]}>
          {t("auth.continueWithGoogle")}
        </Text>
      </Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: c.lineDark }} />
        <Label color={c.onDark3}>{t("auth.or")}</Label>
        <View style={{ flex: 1, height: 1, backgroundColor: c.lineDark }} />
      </View>
    </>
  );
}

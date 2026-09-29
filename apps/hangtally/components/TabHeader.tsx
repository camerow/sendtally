import { useUser } from "@clerk/clerk-expo";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { SettingsSheet } from "../features/settings/SettingsSheet";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";
import { Mark } from "./Mark";

/** The mark and the account avatar, which opens Settings, above every tab. */
export function TabHeader(): React.ReactElement {
  const c = useTheme();
  const { user } = useUser();
  const [settings, setSettings] = React.useState(false);
  const initial = (user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "?")
    .charAt(0)
    .toUpperCase();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Mark size={30} plate={c.accent} ink={c.ground} />
        <Text style={[type.monoBold, { fontSize: 18, letterSpacing: -0.36, color: c.onDark }]}>
          {t("hang.appName")}
        </Text>
      </View>
      <Pressable
        onPress={() => setSettings(true)}
        accessibilityRole="button"
        accessibilityLabel={t("hang.openSettings")}
        hitSlop={5}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.rest,
        }}
      >
        <Text style={[type.bodyBold, { fontSize: 14, color: c.ground }]}>{initial}</Text>
      </Pressable>
      <SettingsSheet visible={settings} onClose={() => setSettings(false)} />
    </View>
  );
}

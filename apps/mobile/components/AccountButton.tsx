import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTrainingMode } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { useApi } from "../lib/api";
import { press } from "../lib/press";

/** The way to settings once training mode takes the Settings tab away; renders nothing otherwise. */
export function AccountButton(): React.ReactElement | null {
  const api = useApi();
  const { enabled } = useTrainingMode(api);
  const { user } = useUser();
  if (!enabled) return null;
  const name = user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "";
  return (
    <Pressable
      onPress={() => router.push("/profile")}
      accessibilityRole="button"
      accessibilityLabel={t("training.account")}
      style={press({
        width: 44,
        height: 44,
        marginRight: -4,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.petalInk,
        }}
      >
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

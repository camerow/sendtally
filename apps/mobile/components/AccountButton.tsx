import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../lib/press";

/** The way to Settings, from every tab's header. */
export function AccountButton(): React.ReactElement {
  const { user } = useUser();
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

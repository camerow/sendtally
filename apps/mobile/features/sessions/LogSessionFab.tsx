import { router } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";

export function LogSessionFab(): React.ReactElement {
  return (
    <Pressable
      onPress={() => router.push("/session/new")}
      accessibilityRole="button"
      style={press({
        position: "absolute",
        right: 18,
        bottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        height: 52,
        paddingHorizontal: 22,
        borderRadius: 26,
        backgroundColor: colors.azureInk,
        shadowColor: "#14131A",
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      })}
    >
      <Icon name="plus" size={17} strokeWidth={3} color={colors.white} />
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
        Log a session
      </Text>
    </Pressable>
  );
}

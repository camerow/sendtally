import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../lib/press";
import { Icon } from "./Icon";

export type FabMenu = { label: string; onPress: () => void };

export type FabProps = {
  label: string;
  onPress: () => void;
  menu?: FabMenu;
};

/** The one thing a screen adds, bottom right; a menu half holds the slower ways. */
export function Fab({ label, onPress, menu }: FabProps): React.ReactElement {
  return (
    <View
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 26,
        backgroundColor: colors.gunmetal,
        shadowColor: "#35343F",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={press({
          height: 52,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingLeft: 16,
          paddingRight: menu === undefined ? 20 : 12,
        })}
      >
        <Icon name="plus" size={18} strokeWidth={2.6} color={colors.gold} />
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
          {label}
        </Text>
      </Pressable>
      {menu !== undefined && (
        <>
          <View style={{ width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.25)" }} />
          <Pressable
            onPress={menu.onPress}
            accessibilityRole="button"
            accessibilityLabel={menu.label}
            style={press({ width: 44, height: 52, alignItems: "center", justifyContent: "center" })}
          >
            <View style={{ transform: [{ rotate: "90deg" }] }}>
              <Icon name="chevron" size={16} strokeWidth={2.2} color={colors.white} />
            </View>
          </Pressable>
        </>
      )}
    </View>
  );
}

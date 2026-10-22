import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { BackButton } from "../../../components/BackButton";

export type ScreenFrameProps = {
  children: React.ReactNode;
  /** Beside the back button, top right. */
  action?: React.ReactNode;
  /** Pinned under the scrolling body. */
  footer?: React.ReactNode;
};

/** A full planning screen: back, a scrolling body that keeps a focused field above the keys, and a footer. */
export function ScreenFrame({ children, action, footer }: ScreenFrameProps): React.ReactElement {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingTop: 6,
        }}
      >
        <BackButton />
        {action}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: 20,
            paddingTop: 8,
            paddingHorizontal: 18,
            paddingBottom: 24,
          }}
        >
          {children}
        </ScrollView>
        {footer !== undefined && (
          <View
            style={{
              paddingTop: 12,
              paddingHorizontal: 18,
              paddingBottom: 10,
              borderTopWidth: 1,
              borderTopColor: colors.lineOnLight,
            }}
          >
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

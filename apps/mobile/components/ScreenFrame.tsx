import React from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { BackButton } from "./BackButton";
import { KeypadScrollView } from "./KeypadScrollView";
import { ToastFooter } from "./Toast";

export type ScreenFrameProps = {
  children?: React.ReactNode;
  /** Beside the back button, top right. */
  action?: React.ReactNode;
  /** Where back goes, when it is worth naming. */
  backLabel?: string;
  /** In place of the back button and action, as an editor's Cancel and Save. */
  header?: React.ReactNode;
  /** Pinned under the scrolling body, hidden while the keypad is up. */
  footer?: React.ReactNode;
  /** Over the whole screen, as a toast is, which sits above the footer. */
  overlay?: React.ReactNode;
};

/** A full screen, planning or detail: back, a scrolling body that keeps a field being typed in above the keys, and a footer. */
export function ScreenFrame({
  children,
  action,
  backLabel,
  header,
  footer,
  overlay,
}: ScreenFrameProps): React.ReactElement {
  const [keypad, setKeypad] = React.useState(false);
  const [footerHeight, setFooterHeight] = React.useState(0);
  const shown = footer !== undefined && !keypad;
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      {header ?? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 18,
            paddingTop: 6,
          }}
        >
          <BackButton label={backLabel} />
          {action}
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <KeypadScrollView
          onKeypadChange={setKeypad}
          contentContainerStyle={{
            gap: 20,
            paddingTop: 8,
            paddingHorizontal: 18,
            paddingBottom: 24,
          }}
        >
          {children}
        </KeypadScrollView>
        {shown && (
          <View
            testID="screen-footer"
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
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
      <ToastFooter.Provider value={shown ? footerHeight : 0}>{overlay}</ToastFooter.Provider>
    </SafeAreaView>
  );
}

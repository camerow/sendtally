import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../lib/press";

export type ToastProps = {
  message: string;
  /** One link, such as View, that also dismisses it. */
  action?: { label: string; onPress: () => void };
  onHide: () => void;
};

const SHOWN_MS = 4000;

/** The height of the footer a toast must clear, so it never hides the screen's main action. */
export const ToastFooter = React.createContext(0);

/** A short word on what just happened, at the foot of the screen above any footer, gone after a few seconds. */
export function Toast({ message, action, onHide }: ToastProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const footer = React.useContext(ToastFooter);
  const hide = React.useRef(onHide);
  React.useEffect(() => {
    hide.current = onHide;
  });
  React.useEffect(() => {
    const timer = setTimeout(() => hide.current(), SHOWN_MS);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <View
      testID="toast"
      accessibilityLiveRegion="polite"
      style={{
        position: "absolute",
        left: 18,
        right: 18,
        bottom: insets.bottom + (footer > 0 ? footer + 12 : 8),
        height: 52,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingLeft: 16,
        paddingRight: 6,
        backgroundColor: colors.gunmetal,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}
      >
        {message}
      </Text>
      {action !== undefined && (
        <Pressable
          onPress={() => {
            onHide();
            action.onPress();
          }}
          accessibilityRole="button"
          style={press({ height: 40, paddingHorizontal: 12, justifyContent: "center" })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gold }}>
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

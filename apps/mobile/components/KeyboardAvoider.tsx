import React from "react";
import { KeyboardAvoidingView } from "react-native";

/**
 * Lifts what it holds above the system keyboard on both platforms, so a focused field stays in
 * view. Android draws edge to edge and no longer resizes the window for the keyboard, so it pads
 * like iOS does.
 */
export function KeyboardAvoider({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {children}
    </KeyboardAvoidingView>
  );
}

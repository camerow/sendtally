import React from "react";
import { Keyboard } from "react-native";

/** Whether the system keyboard is up. */
export function useKeyboardShown(): boolean {
  const [shown, setShown] = React.useState(() => Keyboard.isVisible());
  React.useEffect(() => {
    const subscriptions = [
      Keyboard.addListener("keyboardDidShow", () => setShown(true)),
      Keyboard.addListener("keyboardDidHide", () => setShown(false)),
    ];
    return () => subscriptions.forEach((s) => s.remove());
  }, []);
  return shown;
}

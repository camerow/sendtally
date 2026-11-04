import React from "react";
import { NavigationContext } from "expo-router/react-navigation";

/** True on the screen that is showing, and anywhere outside a screen, such as a root provider. */
export function useScreenFocused(): boolean {
  const navigation = React.useContext(NavigationContext);
  const subscribe = React.useCallback(
    (changed: () => void): (() => void) => {
      if (navigation === undefined) return () => undefined;
      const offFocus = navigation.addListener("focus", changed);
      const offBlur = navigation.addListener("blur", changed);
      return () => {
        offFocus();
        offBlur();
      };
    },
    [navigation]
  );
  const focused = (): boolean => navigation?.isFocused() ?? true;
  return React.useSyncExternalStore(subscribe, focused, focused);
}

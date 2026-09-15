import { useFocusEffect } from "expo-router";
import React from "react";

/** A screen loads on mount; coming back from an edit pushed on top of it is the other time it changes. */
export function useReloadOnReturn(reload: () => void): void {
  const first = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      reload();
    }, [reload])
  );
}

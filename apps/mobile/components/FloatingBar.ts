import React from "react";
import type { ViewStyle } from "react-native";

/** Whether a screen's bar floats over a picture, so its buttons sit on white. */
export const FloatingBar = React.createContext(false);

/** A button floating over a picture: white at 94% with a soft shadow. */
export const FLOATING: ViewStyle = {
  backgroundColor: "rgba(255,255,255,0.94)",
  shadowColor: "#14131A",
  shadowOpacity: 0.18,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
};

import React from "react";
import type { View } from "react-native";
import type { KeypadMode } from "./Keypad";

/** A field asking the screen's one keypad to type into it, as it reads when it opens. */
export type KeypadRequest = {
  id: string;
  label: string;
  mode: KeypadMode;
  value: number;
  box: React.RefObject<View | null>;
  hasNext: boolean;
  hasPrev: boolean;
  commit: (value: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  /** Under the value, such as what the number was as written, with Reset beside it. */
  note?: string;
  reset?: () => void;
};

export type KeypadHost = {
  open: (request: KeypadRequest) => void;
  close: (id: string) => void;
};

/** A screen's one keypad, which stays up and switches field in place as Next walks a form. */
export const KeypadHostContext = React.createContext<KeypadHost | null>(null);

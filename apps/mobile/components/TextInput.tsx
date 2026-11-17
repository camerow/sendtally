import { BottomSheetTextInput, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import React from "react";
import { TextInput as NativeTextInput, type TextInputProps } from "react-native";
import { outsideTap } from "./outsideTap";

export type { TextInputProps };

/**
 * The app's text input. Inside a bottom sheet it is the sheet's own, so the sheet rides the
 * keyboard; anywhere else it is the plain one, which a sheet input would crash outside a sheet.
 * A tap on it keeps the system keyboard up for it (see `outsideTap`).
 */
export function TextInput(props: TextInputProps): React.ReactElement {
  const Input = useBottomSheetInternal(true) === null ? NativeTextInput : BottomSheetTextInput;
  return (
    <Input
      {...props}
      onTouchStart={(e) => {
        outsideTap.onTextInput();
        props.onTouchStart?.(e);
      }}
    />
  );
}

/** The text input that has the keyboard, if any. */
export const focusedInput = (): NativeTextInput | null =>
  NativeTextInput.State.currentlyFocusedInput() as NativeTextInput | null;

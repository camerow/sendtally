import { BottomSheetTextInput, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import React from "react";
import { TextInput as NativeTextInput, type TextInputProps } from "react-native";

export type { TextInputProps };

/**
 * The app's text input. Inside a bottom sheet it is the sheet's own, so the sheet rides the
 * keyboard; anywhere else it is the plain one, which a sheet input would crash outside a sheet.
 */
export function TextInput(props: TextInputProps): React.ReactElement {
  const Input = useBottomSheetInternal(true) === null ? NativeTextInput : BottomSheetTextInput;
  return <Input {...props} />;
}

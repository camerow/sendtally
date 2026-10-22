import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { TextInput, type KeyboardTypeOptions, type StyleProp, type TextStyle } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";

export type NumberFieldProps = {
  value: string;
  onCommit: (text: string) => void;
  label: string;
  placeholder?: string;
  keyboard?: KeyboardTypeOptions;
  inSheet?: boolean;
  style?: StyleProp<TextStyle>;
};

/**
 * Shows `value` until focused, then holds what is typed and commits it on blur
 * or return. A commit the parent rejects leaves `value` unchanged, which is
 * what the field shows again: invalid text reverts.
 */
export function NumberField({
  value,
  onCommit,
  label,
  placeholder,
  keyboard = "decimal-pad",
  inSheet,
  style,
}: NumberFieldProps): React.ReactElement {
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = (): void => {
    if (draft !== null) onCommit(draft);
    setDraft(null);
  };
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  return (
    <Input
      value={draft ?? value}
      onFocus={() => setDraft(value)}
      onChangeText={setDraft}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType={keyboard}
      returnKeyType="done"
      selectTextOnFocus
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      style={[type.monoBold, { textAlign: "center", paddingHorizontal: 6 }, style]}
    />
  );
}

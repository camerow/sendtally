import React from "react";
import { type KeyboardTypeOptions, type StyleProp, type TextStyle } from "react-native";
import { TextInput } from "../../../components/TextInput";
import { colors } from "@sendtally/design/tokens";
import { ungrouped } from "@sendtally/features/i18n";
import { type } from "../type";

export type NumberFieldProps = {
  value: string;
  onCommit: (text: string) => void;
  label: string;
  placeholder?: string;
  keyboard?: KeyboardTypeOptions;
  style?: StyleProp<TextStyle>;
  /** Commit only on blur or return, for a commit that writes to the server. */
  deferred?: boolean;
};

/**
 * Shows `value` until focused, then holds what is typed and commits it as it
 * changes, so a Save pressed with the keyboard still up has it. A commit the
 * parent rejects leaves `value` unchanged, which is what the field shows again
 * on blur: invalid text reverts. Focus drops thousands separators so the number parses back
 * as written, and a blur with nothing typed commits nothing.
 */
export function NumberField({
  value,
  onCommit,
  label,
  placeholder,
  keyboard = "decimal-pad",
  style,
  deferred = false,
}: NumberFieldProps): React.ReactElement {
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = (): void => {
    if (draft !== null && draft !== ungrouped(value)) onCommit(draft);
    setDraft(null);
  };
  return (
    <TextInput
      value={draft ?? value}
      onFocus={() => setDraft(ungrouped(value))}
      onChangeText={(text) => {
        setDraft(text);
        if (!deferred) onCommit(text);
      }}
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

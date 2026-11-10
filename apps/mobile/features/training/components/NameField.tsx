import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { TextInput } from "../../../components/TextInput";
import { type } from "../type";

export type NameFieldProps = {
  value: string;
  onChange: (name: string) => void;
  placeholder: string;
  maxLength: number;
  autoFocus?: boolean;
  onSubmit?: () => void;
  /** Why the name cannot change: shown under it with a lock, and the field is read-only. */
  locked?: string;
  /** What is wrong with the name, in red under it. */
  error?: string;
};

/** An editor's name in a big field. */
export function NameField({
  value,
  onChange,
  placeholder,
  maxLength,
  autoFocus,
  onSubmit,
  locked,
  error,
}: NameFieldProps): React.ReactElement {
  return (
    <View style={{ gap: 4 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t("hang.name")}
        maxLength={maxLength}
        autoFocus={autoFocus}
        editable={locked === undefined}
        multiline
        submitBehavior="blurAndSubmit"
        returnKeyType="done"
        style={[
          type.display,
          {
            fontSize: 30,
            lineHeight: 34,
            paddingVertical: 4,
            paddingHorizontal: 0,
            color: colors.gunmetal,
          },
        ]}
      />
      {locked !== undefined && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Icon name="lock" color={colors.textSecondary} size={14} strokeWidth={1.8} />
          <Text style={[type.body, { flex: 1, fontSize: 12.5, color: colors.textSecondary }]}>
            {locked}
          </Text>
        </View>
      )}
      {error !== undefined && (
        <Text style={[type.body, { fontSize: 13, color: colors.watermelonInk }]}>{error}</Text>
      )}
    </View>
  );
}

import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { Label } from "./Label";

export type KindNameFieldProps = {
  kind: WorkoutKind;
  value: string;
  onChange: (name: string) => void;
  placeholder: string;
  maxLength: number;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

/** An editor's name: its category in the category's ink over a big field. */
export function KindNameField({
  kind,
  value,
  onChange,
  placeholder,
  maxLength,
  autoFocus,
  onSubmit,
}: KindNameFieldProps): React.ReactElement {
  return (
    <View style={{ gap: 4 }}>
      <Label color={KIND_LOOK[kind].ink}>{kindLabel(kind)}</Label>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={t("hang.name")}
        maxLength={maxLength}
        autoFocus={autoFocus}
        returnKeyType={onSubmit === undefined ? undefined : "done"}
        style={[type.display, { fontSize: 30, paddingVertical: 4, color: colors.gunmetal }]}
      />
    </View>
  );
}

import React from "react";
import { TextInput } from "../../../components/TextInput";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";

export type LibrarySearchProps = {
  value: string;
  onChange: (text: string) => void;
};

export function LibrarySearch({ value, onChange }: LibrarySearchProps): React.ReactElement {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={t("workouts.search")}
      placeholderTextColor={colors.textFaint}
      accessibilityLabel={t("workouts.search")}
      autoCorrect={false}
      returnKeyType="search"
      clearButtonMode="while-editing"
      maxLength={80}
      style={{
        fontFamily: fonts.sans,
        fontSize: 15,
        color: colors.gunmetal,
        minHeight: 46,
        paddingHorizontal: 14,
        borderRadius: radius.control,
        backgroundColor: colors.surfaceSoft,
      }}
    />
  );
}

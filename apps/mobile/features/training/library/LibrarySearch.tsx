import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { TextInput } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";

export type LibrarySearchProps = {
  value: string;
  /** Inside a sheet the input has to be the sheet's own, so it rides the keyboard. */
  inSheet: boolean;
  onChange: (text: string) => void;
};

export function LibrarySearch({
  value,
  inSheet,
  onChange,
}: LibrarySearchProps): React.ReactElement {
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  return (
    <Input
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

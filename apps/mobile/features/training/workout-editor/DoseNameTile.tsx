import React from "react";
import { View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { Label } from "../components/Label";

export type DoseNameTileProps = {
  name: string;
  /** What a screen reader calls it: which dose it names. */
  accessibilityLabel: string;
  onChange: (name: string) => void;
};

/** An alternating dose's optional name, such as Heavy, on a tile beside its numbers. */
export function DoseNameTile({
  name,
  accessibilityLabel,
  onChange,
}: DoseNameTileProps): React.ReactElement {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "30%",
        minHeight: 52,
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingTop: 6,
        borderRadius: 10,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Label small color={colors.textSecondary}>
        {t("workouts.doseName")}
      </Label>
      <TextInput
        value={name}
        onChangeText={onChange}
        placeholder={t("workouts.doseNameHint")}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={accessibilityLabel}
        maxLength={24}
        returnKeyType="done"
        style={{
          height: 30,
          padding: 0,
          fontFamily: fonts.sansSemiBold,
          fontSize: 15,
          color: colors.gunmetal,
        }}
      />
    </View>
  );
}

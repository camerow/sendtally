import React from "react";
import { View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { Label } from "../components/Label";

export type DoseNameTileProps = {
  name: string;
  /** What a screen reader calls it: which dose it names. */
  accessibilityLabel: string;
  onChange: (name: string) => void;
};

/** An alternating dose's optional name, such as Heavy, boxed like the numbers beside it. */
export function DoseNameTile({
  name,
  accessibilityLabel,
  onChange,
}: DoseNameTileProps): React.ReactElement {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ flexGrow: 1, flexBasis: "30%", gap: 8 }}>
      <Label color={colors.textSecondary}>{t("workouts.doseName")}</Label>
      <TextInput
        value={name}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t("workouts.doseNameHint")}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={accessibilityLabel}
        maxLength={24}
        returnKeyType="done"
        style={{
          height: 46,
          paddingHorizontal: focused ? 11.3 : 12,
          paddingVertical: 0,
          borderRadius: radius.control,
          backgroundColor: colors.white,
          borderWidth: focused ? 2 : 1.3,
          borderColor: focused ? colors.gold : colors.lineOnLightStrong,
          fontFamily: fonts.sansSemiBold,
          fontSize: 15,
          color: colors.gunmetal,
        }}
      />
    </View>
  );
}

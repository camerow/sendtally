import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Sheet } from "../../components/Sheet";
import { TextInput } from "../../components/TextInput";
import { press } from "../../lib/press";
import { primaryButton, primaryButtonLabel } from "../../lib/styles";

export type RenameSheetProps = {
  visible: boolean;
  name: string;
  saving: boolean;
  failed: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
};

/** Renaming onto the name of another of your climbs folds this one into it. */
export function RenameSheet({
  visible,
  name,
  saving,
  failed,
  onSave,
  onClose,
}: RenameSheetProps): React.ReactElement {
  const [typed, setTyped] = React.useState(name);
  const blank = typed.trim() === "";
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel={t("common.cancel")}
      footer={
        <Pressable
          onPress={() => onSave(typed.trim())}
          disabled={blank || saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: blank || saving }}
          style={press({ ...primaryButton, opacity: blank || saving ? 0.5 : 1 })}
        >
          <Text style={primaryButtonLabel}>{saving ? t("common.saving") : t("common.save")}</Text>
        </Pressable>
      }
    >
      <View style={{ gap: 10, paddingHorizontal: 18, paddingBottom: 8 }}>
        <Text
          accessibilityRole="header"
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.gunmetal }}
        >
          {t("climbs.rename")}
        </Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          autoCorrect={false}
          accessibilityLabel={t("climbs.name")}
          style={{
            minHeight: 50,
            paddingHorizontal: 14,
            borderRadius: radius.control,
            backgroundColor: colors.surfaceSoft,
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.gunmetal,
          }}
        />
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>
          {failed ? t("climbs.renameFailed") : t("climbs.renameHint")}
        </Text>
      </View>
    </Sheet>
  );
}

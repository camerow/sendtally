import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { HangSheet } from "../data/HangSheet";
import { type } from "../type";
import { Button } from "./Button";
import { Label } from "./Label";

export type NameSheetProps = {
  title: string;
  /** Prefilled and selected, so typing replaces it. */
  name: string;
  action: string;
  onSave: (name: string) => void;
  /** Swiping it away saves nothing. */
  onClose: () => void;
};

/** Names something on the way to making it: one field and one button. */
export function NameSheet({
  title,
  name: initial,
  action,
  onSave,
  onClose,
}: NameSheetProps): React.ReactElement {
  const [name, setName] = React.useState(initial);
  const save = (): void => {
    onSave(name.trim() || initial);
    onClose();
  };
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 12, paddingBottom: 12 }}>
        <Text style={[type.bodyBold, { fontSize: 17, color: colors.gunmetal }]}>{title}</Text>
        <View style={{ gap: 4 }}>
          <Label color={colors.textSecondary}>{t("hang.name")}</Label>
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            selectTextOnFocus
            accessibilityLabel={t("hang.name")}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={save}
            style={[
              type.display,
              {
                fontSize: 34,
                lineHeight: 40,
                paddingVertical: 0,
                paddingBottom: 4,
                color: colors.gunmetal,
                borderBottomWidth: 2,
                borderBottomColor: colors.gold,
              },
            ]}
          />
        </View>
        <Button label={action} onPress={save} variant="primary" height={52} />
      </View>
    </HangSheet>
  );
}

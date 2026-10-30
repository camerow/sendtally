import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { Button } from "./Button";

export type EditorHeaderProps = {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
};

/** A full-screen editor's top: Cancel, what is being edited, and Save. */
export function EditorHeader({
  title,
  onCancel,
  onSave,
  saveDisabled,
}: EditorHeaderProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Button label={t("hang.cancel")} onPress={onCancel} variant="link" height={44} />
      <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{title}</Text>
      <Button
        label={t("hang.save")}
        onPress={onSave}
        variant="link"
        height={44}
        disabled={saveDisabled}
      />
    </View>
  );
}

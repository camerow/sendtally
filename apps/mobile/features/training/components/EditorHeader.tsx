import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { Button } from "./Button";

export type EditorHeaderProps = {
  title: string;
  onCancel: () => void;
  cancelLabel?: string;
  /** Cancel throws away real work, such as a workout that was run, so it reads as destructive. */
  cancelDestructive?: boolean;
  onSave: () => void;
  saveDisabled?: boolean;
  /** Save as a solid button, for an Edit mode on a detail screen. */
  solid?: boolean;
};

/** A full-screen editor's top: Cancel, what is being edited, and Save. */
export function EditorHeader({
  title,
  onCancel,
  cancelLabel = t("hang.cancel"),
  cancelDestructive = false,
  onSave,
  saveDisabled,
  solid = false,
}: EditorHeaderProps): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: 2,
        paddingRight: solid ? 18 : 2,
        paddingVertical: 4,
      }}
    >
      <Button
        label={cancelLabel}
        onPress={onCancel}
        variant={cancelDestructive ? "danger" : "plain"}
        height={44}
      />
      <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{title}</Text>
      <Button
        label={t("hang.save")}
        onPress={onSave}
        variant={solid ? "primary" : "link"}
        height={solid ? 40 : 44}
        disabled={saveDisabled}
      />
    </View>
  );
}

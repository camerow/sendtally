import { Alert } from "react-native";
import { t } from "@sendtally/features/i18n";

export type ConfirmDestructive = {
  title: string;
  body?: string;
  /** The red button's label: what it does, "Delete", "Remove", "Discard". */
  action: string;
  onConfirm: () => void;
};

/** Asks before anything that cannot be undone: Cancel, or the action in red. */
export function confirmDestructive({ title, body, action, onConfirm }: ConfirmDestructive): void {
  Alert.alert(title, body, [
    { text: t("common.cancel"), style: "cancel" },
    { text: action, style: "destructive", onPress: onConfirm },
  ]);
}

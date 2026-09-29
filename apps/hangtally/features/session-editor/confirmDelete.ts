import { Alert } from "react-native";
import { t } from "@sendtally/features/i18n";

/** Strava's API cannot delete activities, so a posted session's activity stays and the prompt says so. */
export function confirmDelete(posted: boolean, onConfirm: () => void): void {
  Alert.alert(
    t("hang.deleteConfirmTitle"),
    posted ? t("hang.deleteConfirmStrava") : t("hang.deleteConfirm"),
    [
      { text: t("hang.cancel"), style: "cancel" },
      { text: t("hang.delete"), style: "destructive", onPress: onConfirm },
    ]
  );
}

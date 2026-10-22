import { Alert } from "react-native";
import { t } from "@sendtally/features/i18n";

/** Asks before a workout of the user's own goes; `body` says what happens to its plans. */
export function confirmDeleteWorkout(name: string, body: string, onDelete: () => void): void {
  Alert.alert(t("workouts.deleteTitle", { name }), body, [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("common.delete"), style: "destructive", onPress: onDelete },
  ]);
}

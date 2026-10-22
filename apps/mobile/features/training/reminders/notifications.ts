import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { t } from "@sendtally/features/i18n";
import type { TrainingReminder } from "@sendtally/features/training";

const CHANNEL = "reminders";

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

export async function notificationsAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Shows the system dialog, which only ever follows an explicit "Remind me". */
export async function requestNotifications(): Promise<boolean> {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: t("training.reminders"),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Replaces every pending reminder on this phone with `reminders`. */
export async function replaceReminders(reminders: readonly TrainingReminder[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const { at, title, body } of reminders) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: CHANNEL,
      },
    });
  }
}

export function cancelReminders(): Promise<void> {
  return Notifications.cancelAllScheduledNotificationsAsync();
}

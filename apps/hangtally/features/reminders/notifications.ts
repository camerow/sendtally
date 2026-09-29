import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { t } from "@sendtally/features/i18n";
import { reminderMoment, type Reminder } from "./reminderPlan";

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
      name: t("hang.reminders"),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Replaces every pending reminder with `reminders`, dropping any whose moment has passed. */
export async function replaceReminders(
  reminders: readonly { reminder: Reminder; body: string }[],
  time: string,
  now: Date = new Date()
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const { reminder, body } of reminders) {
    const date = reminderMoment(reminder.date, time);
    if (date <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: t("hang.reminderTitle"), body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
}

export function cancelReminders(): Promise<void> {
  return Notifications.cancelAllScheduledNotificationsAsync();
}

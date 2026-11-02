import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { t } from "@sendtally/features/i18n";
import type { TrainingReminder } from "@sendtally/features/training";

const CHANNEL = "reminders";
const TIMER_CHANNEL = "timer";

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

/**
 * Android only: the quiet channel the running timer posts to, and the permission to show it,
 * asked the first time a timer starts. Declined is fine: the timer still runs and plays its cues.
 */
export async function prepareTimerNotifications(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(TIMER_CHANNEL, {
    name: t("training.timerChannel"),
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    enableVibrate: false,
    showBadge: false,
  });
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  if (!granted && canAskAgain) await Notifications.requestPermissionsAsync();
}

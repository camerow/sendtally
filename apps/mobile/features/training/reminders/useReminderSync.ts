import React from "react";
import { AppState } from "react-native";
import {
  trainingReminders,
  type ReminderNames,
  type TrainingLog,
} from "@sendtally/features/training";
import { useToday } from "../data/useToday";
import { cancelReminders, notificationsAllowed, replaceReminders } from "./notifications";

const SETTLE_MS = 1500;

export type ReminderSource = {
  on: boolean;
  time: string;
  /** Null until everything the reminders read has loaded, which leaves the phone as it is. */
  log: TrainingLog | null;
  names: ReminderNames;
};

/** Counts returns to the foreground, so the window rolls on even when nothing else changed. */
function useForegrounds(): number {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (s) => s === "active" && setCount((n) => n + 1)
    );
    return () => subscription.remove();
  }, []);
  return count;
}

/** Keeps the phone's scheduled reminders in step with the plan, the log and the setting. */
export function useReminderSync({ on, time, log, names }: ReminderSource): void {
  const today = useToday();
  const foregrounds = useForegrounds();

  React.useEffect(() => () => void cancelReminders(), []);

  React.useEffect(() => {
    if (on && log === null) return;
    const timer = setTimeout(() => {
      void (async () => {
        if (!on || log === null || !(await notificationsAllowed())) return cancelReminders();
        await replaceReminders(trainingReminders(log, names, today, time, new Date()));
      })();
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [on, time, log, names, today, foregrounds]);
}

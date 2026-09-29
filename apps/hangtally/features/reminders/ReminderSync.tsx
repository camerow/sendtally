import React from "react";
import { useHangData } from "../data/HangDataContext";
import { cancelReminders, notificationsAllowed, replaceReminders } from "./notifications";
import { reminderPlan } from "./reminderPlan";

const SETTLE_MS = 1500;

/** Keeps the phone's scheduled reminders in step with the schedule, the log and Settings. */
export function ReminderSync(): null {
  const { model, today } = useHangData();
  const { reminders, reminderTime } = model.settings;
  const schedules = model.data.schedules;
  const sessions = model.sessions;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        if (!reminders || !(await notificationsAllowed())) return cancelReminders();
        const plan = reminderPlan(schedules, sessions, today).map((reminder) => ({
          reminder,
          body: reminder.scheduleIds
            .flatMap((id) => {
              const s = schedules.find((x) => x.id === id);
              const w = s && model.workout(s.workoutId);
              return s && w ? [`${w.name} · ${model.gripName(s.gripId)}`] : [];
            })
            .join(", "),
        }));
        await replaceReminders(plan, reminderTime);
      })();
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [model, reminders, reminderTime, schedules, sessions, today]);

  return null;
}

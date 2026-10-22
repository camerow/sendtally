import React from "react";
import { useTrainingMode } from "@sendtally/features/settings";
import { useApi } from "../../../lib/api";
import { ActiveReminders, type ActiveRemindersProps } from "./ActiveReminders";
import { cancelReminders } from "./notifications";

export type TrainingRemindersProps = ActiveRemindersProps;

/** The signed-in half of reminders. Nothing training-only loads until training mode is on. */
export function TrainingReminders(props: TrainingRemindersProps): React.ReactElement | null {
  const { enabled, ready } = useTrainingMode(useApi());
  React.useEffect(() => {
    if (ready && !enabled) void cancelReminders();
  }, [ready, enabled]);
  return enabled ? <ActiveReminders {...props} /> : null;
}

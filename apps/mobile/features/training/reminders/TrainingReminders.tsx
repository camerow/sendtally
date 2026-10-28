import React from "react";
import { ActiveReminders, type ActiveRemindersProps } from "./ActiveReminders";

export type TrainingRemindersProps = ActiveRemindersProps;

/** The signed-in half of reminders. */
export function TrainingReminders(props: TrainingRemindersProps): React.ReactElement {
  return <ActiveReminders {...props} />;
}

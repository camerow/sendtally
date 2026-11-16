import React from "react";
import { Alert } from "react-native";
import { t } from "@sendtally/features/i18n";
import { useTrainingReminders } from "@sendtally/features/settings";
import { useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { requestNotifications } from "./notifications";
import { ReminderPromptSheet } from "./ReminderPromptSheet";
import { useReminderSync } from "./useReminderSync";

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

export type ActiveRemindersProps = {
  /** Something was just added to the plan, so the first-time prompt may show. */
  asked: boolean;
  onAnswered: () => void;
  /** Whether the prompt is up, so what it covers can wait for it. */
  onOpenChange: (open: boolean) => void;
};

/** Keeps training reminders scheduled and asks once for permission. */
export function ActiveReminders({
  asked,
  onAnswered,
  onOpenChange,
}: ActiveRemindersProps): React.ReactElement {
  const api = useApi();
  const { settings, save } = useTrainingReminders(api);
  const { log, ready } = useTrainingLog(api);

  useReminderSync({
    on: settings?.enabled === true,
    time: settings?.time ?? "08:00",
    log: ready ? log : null,
  });

  const open = asked && settings !== null && !settings.promptSeen;
  React.useEffect(() => onOpenChange(open), [open, onOpenChange]);
  const answer = async (remind: boolean): Promise<void> => {
    if (!open) return;
    onAnswered();
    const granted = remind && (await requestNotifications());
    await save({ promptSeen: true, enabled: granted }).catch(reportFailure);
  };

  return (
    <ReminderPromptSheet
      visible={open}
      time={settings?.time ?? "08:00"}
      onAnswer={(remind) => void answer(remind)}
    />
  );
}

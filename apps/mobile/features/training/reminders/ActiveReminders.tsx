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
};

/** Keeps training reminders scheduled and asks once for permission. */
export function ActiveReminders({ asked, onAnswered }: ActiveRemindersProps): React.ReactElement {
  const api = useApi();
  const { settings, save } = useTrainingReminders(api);
  const { log, ready } = useTrainingLog(api);

  useReminderSync({
    on: settings?.enabled === true,
    time: settings?.time ?? "08:00",
    log: ready ? log : null,
  });

  const open = asked && settings !== null && !settings.promptSeen;
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

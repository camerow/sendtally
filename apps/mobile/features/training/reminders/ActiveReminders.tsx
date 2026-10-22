import React from "react";
import { Alert } from "react-native";
import { usePlanItems } from "@sendtally/features/activities";
import { useHang } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { useTrainingReminders } from "@sendtally/features/settings";
import type { ReminderNames, TrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { requestNotifications } from "./notifications";
import { ReminderPromptSheet } from "./ReminderPromptSheet";
import { useReminderSync } from "./useReminderSync";

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

const NO_NAMES: ReminderNames = { workout: () => undefined, gripName: (id) => id };

export type ActiveRemindersProps = {
  /** Something was just added to the plan, so the first-time prompt may show. */
  asked: boolean;
  onAnswered: () => void;
};

/** Keeps training reminders scheduled and asks once for permission. */
export function ActiveReminders({ asked, onAnswered }: ActiveRemindersProps): React.ReactElement {
  const api = useApi();
  const hang = useHang(api).state;
  const { settings, save } = useTrainingReminders(api);
  const sessions = useQuery(queries.sessions(api)).state;
  const planItems = usePlanItems(api).state;
  const model = hang.status === "ready" ? hang.data : null;

  const log = React.useMemo(
    (): TrainingLog | null =>
      model === null || sessions.status !== "ready" || planItems.status !== "ready"
        ? null
        : {
            climbs: sessions.data.sessions,
            hangs: model.sessions,
            activities: sessions.data.activities,
            schedules: model.data.schedules,
            planItems: planItems.data,
          },
    [model, sessions, planItems]
  );

  useReminderSync({
    on: settings?.enabled === true,
    time: settings?.time ?? "08:00",
    log,
    names: model ?? NO_NAMES,
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

import React from "react";
import { Alert, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { useTrainingReminders } from "@sendtally/features/settings";
import { colors, fonts } from "@sendtally/design/tokens";
import { DateTimeField } from "../../components/DateTimeField";
import { Switch } from "../../components/Switch";
import { useApi } from "../../lib/api";
import { bodyText, messageText, sectionCard, sectionLabel } from "../../lib/styles";
import { requestNotifications } from "../training/reminders/notifications";

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

const rowTitle = { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.gunmetal } as const;

/** One notification on training days, stored with the account's other preferences. */
export function TrainingRemindersSection(): React.ReactElement {
  const { settings, save } = useTrainingReminders(useApi());
  const [blocked, setBlocked] = React.useState(false);
  const on = settings?.enabled === true;

  const toggle = async (next: boolean): Promise<void> => {
    const allowed = !next || (await requestNotifications());
    setBlocked(!allowed);
    await save({ enabled: next && allowed, promptSeen: true }).catch(reportFailure);
  };

  return (
    <View style={sectionCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={sectionLabel}>{t("training.reminders")}</Text>
          <Text style={bodyText}>{t("training.remindersNote")}</Text>
        </View>
        <Switch
          checked={on}
          onChange={(next) => void toggle(next)}
          disabled={settings === null}
          label={t("training.reminders")}
        />
      </View>
      {on && settings !== null && (
        <>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnLight }} />
          <View style={{ gap: 8 }}>
            <Text style={rowTitle}>{t("hang.reminderTime")}</Text>
            <DateTimeField
              mode="time"
              value={settings.time}
              label={t("hang.reminderTime")}
              onChange={(time) => void save({ time }).catch(reportFailure)}
            />
          </View>
        </>
      )}
      {blocked && <Text style={messageText}>{t("training.remindersBlocked")}</Text>}
    </View>
  );
}

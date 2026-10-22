import React from "react";
import { Alert, Text, View } from "react-native";
import { useHang, useHangActions } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { DateTimeField } from "../../components/DateTimeField";
import { Switch } from "../../components/Switch";
import { useApi } from "../../lib/api";
import { bodyText, messageText, sectionCard, sectionLabel } from "../../lib/styles";
import { requestNotifications } from "../training/reminders/notifications";

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

const rowTitle = { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.gunmetal } as const;

/** One notification on training days, stored with the rest of the training settings. */
export function TrainingRemindersSection(): React.ReactElement {
  const api = useApi();
  const hang = useHang(api).state;
  const actions = useHangActions(api, reportFailure);
  const [blocked, setBlocked] = React.useState(false);
  const settings = hang.status === "ready" ? hang.data.settings : null;
  const on = settings?.reminders === true;

  const toggle = async (next: boolean): Promise<void> => {
    const allowed = !next || (await requestNotifications());
    setBlocked(!allowed);
    await actions.saveSettings({ reminders: next && allowed, reminderPromptSeen: true });
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
              value={settings.reminderTime}
              label={t("hang.reminderTime")}
              onChange={(time) => void actions.saveSettings({ reminderTime: time })}
            />
          </View>
        </>
      )}
      {blocked && <Text style={messageText}>{t("training.remindersBlocked")}</Text>}
    </View>
  );
}

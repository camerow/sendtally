import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { SheetSection } from "../../components/SheetSection";
import { TimeField } from "../../components/TimeField";
import { ToggleRow } from "../../components/ToggleRow";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { requestNotifications } from "../reminders/notifications";

export function RemindersSetting(): React.ReactElement {
  const c = useTheme();
  const { model, actions } = useHangData();
  const { reminders, reminderTime } = model.settings;
  const [blocked, setBlocked] = React.useState(false);

  const toggle = async (on: boolean): Promise<void> => {
    const allowed = !on || (await requestNotifications());
    setBlocked(!allowed);
    void actions.saveSettings({ reminders: on && allowed, reminderPromptSeen: true });
  };

  return (
    <SheetSection label={t("hang.reminders")}>
      <ToggleRow
        label={t("hang.remindMe")}
        note={t("hang.remindersNote")}
        value={reminders}
        onChange={(on) => void toggle(on)}
      />
      {reminders && (
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={[type.bodyBold, { fontSize: 15, color: c.ink }]}>
            {t("hang.reminderTime")}
          </Text>
          <TimeField
            value={reminderTime}
            label={t("hang.reminderTime")}
            onChange={(time) => void actions.saveSettings({ reminderTime: time })}
          />
        </View>
      )}
      {blocked && (
        <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: c.ink2 }]}>
          {t("hang.remindersBlocked")}
        </Text>
      )}
    </SheetSection>
  );
}

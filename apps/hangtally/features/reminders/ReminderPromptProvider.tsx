import React from "react";
import { Text, View } from "react-native";
import { timeOfDay } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { Title } from "../../components/Title";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { requestNotifications } from "./notifications";

const PromptContext = React.createContext<() => void>(() => undefined);

/** Asks the first time a workout goes on the schedule. */
export function useReminderPrompt(): () => void {
  return React.useContext(PromptContext);
}

export function ReminderPromptProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const c = useTheme();
  const { model, actions } = useHangData();
  const [open, setOpen] = React.useState(false);
  const seen = model.settings.reminderPromptSeen;
  const prompt = React.useCallback(() => {
    if (!seen) setOpen(true);
  }, [seen]);

  const answer = async (remind: boolean): Promise<void> => {
    setOpen(false);
    const granted = remind && (await requestNotifications());
    void actions.saveSettings({ reminderPromptSeen: true, reminders: granted });
  };

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <Sheet
        visible={open}
        onClose={() => open && void answer(false)}
        closeLabel={t("hang.notNow")}
      >
        <View style={{ gap: 12, paddingTop: 10 }}>
          <Title size={30} color={c.ink}>
            {t("hang.reminderPromptTitle")}
          </Title>
          <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: c.ink2 }]}>
            {t("hang.reminderPromptBody", { time: timeOfDay(model.settings.reminderTime) })}
          </Text>
          <View style={{ gap: 8, paddingTop: 8 }}>
            <Button
              label={t("hang.remindMe")}
              onPress={() => void answer(true)}
              variant="ink"
              height={54}
            />
            <Button
              label={t("hang.notNow")}
              onPress={() => void answer(false)}
              variant="outlineLight"
            />
          </View>
        </View>
      </Sheet>
    </PromptContext.Provider>
  );
}

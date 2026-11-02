import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { timeOfDay } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { Button } from "../components/Button";
import { Title } from "../components/Title";
import { type } from "../type";

export type ReminderPromptSheetProps = {
  visible: boolean;
  time: string;
  onAnswer: (remind: boolean) => void;
};

export function ReminderPromptSheet({
  visible,
  time,
  onAnswer,
}: ReminderPromptSheetProps): React.ReactElement {
  return (
    <Sheet visible={visible} onClose={() => onAnswer(false)} closeLabel={t("hang.notNow")}>
      <View style={{ gap: 12, paddingHorizontal: 18, paddingTop: 10 }}>
        <Title size={30}>{t("hang.reminderPromptTitle")}</Title>
        <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.textSecondary }]}>
          {t("training.reminderPromptBody", { time: timeOfDay(time) })}
        </Text>
        <View style={{ gap: 8, paddingTop: 8 }}>
          <Button
            label={t("hang.remindMe")}
            onPress={() => onAnswer(true)}
            variant="primary"
            height={54}
          />
          <Button label={t("hang.notNow")} onPress={() => onAnswer(false)} variant="outline" />
        </View>
      </View>
    </Sheet>
  );
}

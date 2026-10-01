import React from "react";
import { Pressable, Text, View } from "react-native";
import { byDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { HistoryRow } from "../sessions/HistoryRow";

const SHOWN = 5;

export type WorkoutHistoryProps = {
  workoutId: string;
  onOpen: (sessionId: string) => void;
  onTrends: () => void;
};

export function WorkoutHistory({
  workoutId,
  onOpen,
  onTrends,
}: WorkoutHistoryProps): React.ReactElement {
  const c = useTheme();
  const { model } = useHangData();
  const [all, setAll] = React.useState(false);
  const sessions = model.sessions
    .filter((s) => s.workoutId === workoutId)
    .sort(byDate)
    .reverse();
  const shown = all ? sessions : sessions.slice(0, SHOWN);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 6 }}>
        <Label color={c.onDark3}>
          {t("hang.history", { count: t("hang.sessionCount", { count: sessions.length }) })}
        </Label>
        <Pressable onPress={onTrends} accessibilityRole="link" hitSlop={14}>
          <Label color={c.accent}>{t("hang.seeTrends")}</Label>
        </Pressable>
      </View>
      {sessions.length === 0 && (
        <Text style={[type.body, { fontSize: 14, color: c.onDark3, paddingVertical: 8 }]}>
          {t("hang.noHistory")}
        </Text>
      )}
      {shown.map((s) => (
        <HistoryRow key={s.id} session={s} title="grip" onPress={() => onOpen(s.id)} />
      ))}
      {sessions.length > SHOWN && (
        <Button
          label={all ? t("hang.showFewer") : t("hang.showAll", { n: sessions.length })}
          onPress={() => setAll(!all)}
          variant="link"
          height={44}
          style={{ alignSelf: "center" }}
        />
      )}
    </View>
  );
}

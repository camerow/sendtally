import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { byDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { HistoryRow } from "../sessions/HistoryRow";
import { type } from "../type";

const SHOWN = 5;

export type WorkoutHistoryProps = {
  workoutId: string;
  onOpen: (sessionId: string) => void;
};

export function WorkoutHistory({ workoutId, onOpen }: WorkoutHistoryProps): React.ReactElement {
  const { model } = useHangData();
  const [all, setAll] = React.useState(false);
  const sessions = model.sessions
    .filter((s) => s.workoutId === workoutId)
    .sort(byDate)
    .reverse();
  const shown = all ? sessions : sessions.slice(0, SHOWN);
  return (
    <View style={{ gap: 2 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 32,
        }}
      >
        <Label color={colors.gunmetal}>
          {t("hang.history", { count: t("hang.sessionCount", { count: sessions.length }) })}
        </Label>
      </View>
      {sessions.length === 0 && (
        <Text
          style={[type.body, { fontSize: 14, color: colors.textSecondary, paddingVertical: 8 }]}
        >
          {t("hang.noHistory")}
        </Text>
      )}
      {shown.map((s) => (
        <HistoryRow key={s.id} session={s} onPress={() => onOpen(s.id)} />
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

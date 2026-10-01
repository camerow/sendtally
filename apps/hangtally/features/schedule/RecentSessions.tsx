import React from "react";
import { View } from "react-native";
import { byDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { useHangData } from "../data/HangDataContext";
import { HistoryRow } from "../sessions/HistoryRow";

const RECENT = 4;

export function RecentSessions({
  onOpen,
}: {
  onOpen: (id: string) => void;
}): React.ReactElement | null {
  const c = useTheme();
  const { model } = useHangData();
  const recent = [...model.sessions].sort(byDate).reverse().slice(0, RECENT);
  if (recent.length === 0) return null;
  return (
    <View style={{ gap: 4 }}>
      <Label color={c.onDark3} style={{ paddingBottom: 6 }}>
        {t("hang.recentSessions")}
      </Label>
      {recent.map((s) => (
        <HistoryRow key={s.id} session={s} title="workout" onPress={() => onOpen(s.id)} />
      ))}
    </View>
  );
}

import { router, useNavigation } from "expo-router";
import React from "react";
import { View } from "react-native";
import { addDays, weekStart, weekday, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { longDate } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import {
  trainingDay,
  trainingWeek,
  useTrainingLog,
  weekStats,
  type LoggedItem,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { StatGrid } from "../components/StatGrid";
import { useHangData } from "../data/HangDataContext";
import { SessionEditorSheet } from "../session-editor/SessionEditorSheet";
import { DaySection } from "./DaySection";
import { WeekStrip } from "./WeekStrip";

/** The training-mode home: this week's training, logged and planned, day by day. */
export function TodayScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const [offset, setOffset] = React.useState(0);
  const [selected, setSelected] = React.useState<CalendarDate>(today);
  const [editing, setEditing] = React.useState<string | null>(null);

  React.useEffect(
    () =>
      navigation.addListener("tabPress" as never, () => {
        setOffset(0);
        setSelected(today);
      }),
    [navigation, today]
  );

  const monday = addDays(weekStart(today), offset * 7);
  const days = trainingWeek(log, monday, today);
  const day = trainingDay(log, selected, today);
  const stats = weekStats(log, today);

  const changeWeek = (next: number): void => {
    setOffset(next);
    setSelected(addDays(addDays(weekStart(today), next * 7), weekday(selected)));
  };
  const open = (item: LoggedItem): void => {
    if (item.kind === "hang") setEditing(item.session.id);
    else if (item.kind === "activity")
      router.push({ pathname: "/activity/[id]", params: { id: item.activity.id } });
    else
      router.push({
        pathname: "/session/[fingerprint]",
        params: { fingerprint: item.session.fingerprint },
      });
  };

  return (
    <View style={{ gap: 16 }}>
      <Label color={colors.gunmetal}>{longDate(today)}</Label>
      <WeekStrip
        offset={offset}
        days={days}
        selected={selected}
        onSelect={setSelected}
        onOffset={changeWeek}
      />
      <DaySection day={day} onOpen={open} />
      <StatGrid
        columns={3}
        stats={[
          {
            label: t("training.statDone"),
            value: t("training.doneOf", { done: stats.done, planned: stats.planned }),
          },
          {
            label: t("hang.statAvgEffort"),
            value:
              stats.effort === null
                ? "–"
                : formatNumber(stats.effort, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }),
          },
          { label: t("hang.statStreak"), value: formatNumber(stats.streak) },
        ]}
      />
      <SessionEditorSheet sessionId={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

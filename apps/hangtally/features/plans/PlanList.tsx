import React from "react";
import { Text, View } from "react-native";
import { liveSchedules, type Schedule } from "@sendtally/core/hang";
import { PlanRow } from "../../components/PlanRow";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { planText } from "./planText";

export type PlanListProps = {
  workoutId?: string;
  empty: string;
  showName: boolean;
  onOpen: (s: Schedule) => void;
};

/** Live scheduled workouts, by start date: tap to edit, × to remove. */
export function PlanList({
  workoutId,
  empty,
  showName,
  onOpen,
}: PlanListProps): React.ReactElement {
  const c = useTheme();
  const { model, actions, today } = useHangData();
  const plans = liveSchedules(model.data.schedules, today, workoutId);
  if (plans.length === 0)
    return <Text style={[type.body, { fontSize: 14, color: c.onDark3 }]}>{empty}</Text>;
  return (
    <View style={{ gap: 8 }}>
      {plans.map((s) => {
        const text = planText(s, model, today);
        if (text === null) return null;
        return (
          <PlanRow
            key={s.id}
            tag={text.tag}
            tagColor={text.started ? c.accent : c.rest}
            name={showName ? text.name : undefined}
            meta={text.meta}
            onOpen={() => onOpen(s)}
            onRemove={() => void actions.deleteSchedule(s.id)}
            removeLabel={text.removeLabel}
          />
        );
      })}
    </View>
  );
}

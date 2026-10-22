import React from "react";
import { View } from "react-native";
import type { PlanItem } from "@sendtally/api-client";
import { planStatus, type CalendarDate, type Schedule } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { planStatusLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { PlanRow } from "../components/PlanRow";
import { useHangData } from "../data/HangDataContext";
import { planText } from "../plans/planText";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK, kindName } from "../today/kindLook";
import { planItemWhen } from "./planItemText";
import type { PlanRequest } from "./types";
import { usePlanActions } from "./usePlanActions";

const tagColor = (start: CalendarDate, today: CalendarDate, ink: string): string =>
  start <= today ? colors.labelAccent : ink;

export type PlanRowsProps = {
  schedules: readonly Schedule[];
  items: readonly PlanItem[];
  onPlan: (request: PlanRequest) => void;
};

/** A row per plan, hangboard workouts first: tap to edit, × to remove. */
export function PlanRows({ schedules, items, onPlan }: PlanRowsProps): React.ReactElement {
  const { model, actions, today } = useHangData();
  const planActions = usePlanActions();
  return (
    <View style={{ gap: 8 }}>
      {schedules.map((s) => {
        const text = planText(s, model, today);
        if (text === null) return null;
        return (
          <PlanRow
            key={s.id}
            mark={<DayMark kind="hang" filled />}
            tag={text.tag}
            tagColor={tagColor(s.start, today, KIND_LOOK.hang.ink)}
            name={text.name}
            meta={text.meta}
            onOpen={() => onPlan({ mode: "hang", request: { mode: "edit", schedule: s } })}
            onRemove={() => void actions.deleteSchedule(s.id)}
            removeLabel={text.removeLabel}
          />
        );
      })}
      {items.map((item) => (
        <PlanRow
          key={item.id}
          mark={<DayMark kind={item.kind} filled />}
          tag={planStatusLabel(planStatus(item, today))}
          tagColor={tagColor(item.start, today, KIND_LOOK[item.kind].ink)}
          name={item.title}
          meta={`${kindName(item.kind)} · ${planItemWhen(item)}`}
          onOpen={() => onPlan({ mode: "item", request: { mode: "edit", item } })}
          onRemove={() => void planActions.deletePlanItem(item.id)}
          removeLabel={t("plan.remove", { title: item.title })}
        />
      ))}
    </View>
  );
}

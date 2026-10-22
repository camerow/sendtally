import React from "react";
import { View } from "react-native";
import {
  isLive,
  liveSchedules,
  planStatus,
  weekday,
  type CalendarDate,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { usePlanItems } from "@sendtally/features/activities";
import { planStatusLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { PlanRow } from "../components/PlanRow";
import { useHangData } from "../data/HangDataContext";
import { planText } from "../plans/planText";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK, kindName } from "../today/kindLook";
import { PlanGrid } from "./PlanGrid";
import { planGridRows } from "./planGridRows";
import { planItemWhen } from "./planItemText";
import { PlanSheets } from "./PlanSheets";
import type { PlanRequest } from "./types";
import { usePlanActions } from "./usePlanActions";

const tagColor = (start: CalendarDate, today: CalendarDate, ink: string): string =>
  start <= today ? colors.labelAccent : ink;

/** Train > Plan: every live plan, hangboard and otherwise, as a week grid and a list to edit. */
export function PlanOverview(): React.ReactElement {
  const { model, actions, today } = useHangData();
  const loaded = usePlanItems(useApi()).state;
  const planActions = usePlanActions();
  const [plan, setPlan] = React.useState<PlanRequest | null>(null);
  const schedules = liveSchedules(model.data.schedules, today);
  const items =
    loaded.status === "ready"
      ? loaded.data.filter((i) => isLive(i, today)).sort((a, b) => a.start.localeCompare(b.start))
      : [];
  const rows = planGridRows(schedules, items, model);

  return (
    <View style={{ gap: 16 }}>
      {rows.length === 0 ? <DashedPanel body={t("plan.empty")} /> : <PlanGrid rows={rows} />}
      {rows.length > 0 && (
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
                onOpen={() => setPlan({ mode: "hang", request: { mode: "edit", schedule: s } })}
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
              onOpen={() => setPlan({ mode: "item", request: { mode: "edit", item } })}
              onRemove={() => void planActions.deletePlanItem(item.id)}
              removeLabel={t("plan.remove", { title: item.title })}
            />
          ))}
        </View>
      )}
      <Button
        label={t("plan.planTraining")}
        onPress={() => setPlan({ mode: "choose", days: [weekday(today)], start: today })}
        variant="dashed"
        icon="plus"
        height={50}
      />
      <PlanSheets request={plan} onChange={setPlan} />
    </View>
  );
}

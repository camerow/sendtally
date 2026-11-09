import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockOfMembership, daysThisWeek, usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { PlanRow } from "../components/PlanRow";
import { useHangData } from "../data/HangDataContext";
import { MiniWeek } from "../plan/MiniWeek";
import { usePlanActions } from "../plan/usePlanActions";
import { plannedIn } from "./planText";
import { confirmDestructive } from "../../../lib/confirmDestructive";

export type PlanListProps = { workoutId: string; name: string; kind: WorkoutKind };

/** Where a workout is planned, by start date: × takes it out. Left out when it is planned nowhere. */
export function PlanList({ workoutId, name, kind }: PlanListProps): React.ReactElement | null {
  const { today } = useHangData();
  const { state } = usePlan(useApi());
  const actions = usePlanActions();
  const plan = state.status === "ready" ? state.data : null;
  const members = plan?.memberships.filter((m) => m.workoutId === workoutId) ?? [];
  if (plan === null || members.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      <Label color={colors.gunmetal}>{t("plan.plannedIn")}</Label>
      {members.map((m) => {
        const block = blockOfMembership(plan, m);
        const { name: where, meta } = plannedIn(m, block, today);
        return (
          <PlanRow
            key={m.id}
            name={where}
            meta={meta}
            trailing={
              <MiniWeek kind={kind} m={{ ...m, weekdays: daysThisWeek(plan, m, block, today) }} />
            }
            onRemove={() =>
              confirmDestructive({
                title: t("plan.removeTitle", { title: name }),
                body: t("plan.removeBody"),
                action: t("plan.removeAction"),
                onConfirm: () => void actions.deleteMembership(m.id),
              })
            }
            removeLabel={t("plan.remove", { title: name })}
          />
        );
      })}
    </View>
  );
}

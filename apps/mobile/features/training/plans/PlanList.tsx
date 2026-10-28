import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockOfMembership, usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { PlanRow } from "../components/PlanRow";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";
import { membershipTag, membershipWhen } from "./planText";
import { confirmDestructive } from "../../../lib/confirmDestructive";

export type PlanListProps = { workoutId: string; name: string; empty: string };

/** Where a workout is planned, by start date: × takes it out. */
export function PlanList({ workoutId, name, empty }: PlanListProps): React.ReactElement {
  const { today } = useHangData();
  const { state } = usePlan(useApi());
  const actions = usePlanActions();
  const plan = state.status === "ready" ? state.data : null;
  const members = plan?.memberships.filter((m) => m.workoutId === workoutId) ?? [];
  if (plan === null || members.length === 0)
    return <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>{empty}</Text>;
  return (
    <View style={{ gap: 8 }}>
      {members.map((m) => {
        const block = blockOfMembership(plan, m);
        return (
          <PlanRow
            key={m.id}
            tag={membershipTag(m, block, today)}
            tagColor={m.start <= today ? colors.gunmetal : colors.petalInk}
            meta={[block?.name, membershipWhen(m)].filter((p) => p !== undefined).join(" · ")}
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

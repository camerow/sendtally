import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { Plan } from "@sendtally/api-client";
import type { Membership } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { blockOfMembership, type WorkoutLookup } from "@sendtally/features/training";
import { PlanRow } from "../components/PlanRow";
import { useHangData } from "../data/HangDataContext";
import { membershipTag, membershipWhen } from "../plans/planText";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";
import { usePlanActions } from "./usePlanActions";

export type PlanRowsProps = {
  plan: Plan;
  members: readonly Membership[];
  workout: WorkoutLookup;
};

/** A row per membership: tap to open its workout, × to take it out of the plan. */
export function PlanRows({ plan, members, workout }: PlanRowsProps): React.ReactElement {
  const { today } = useHangData();
  const actions = usePlanActions();
  return (
    <View style={{ gap: 8 }}>
      {members.map((m) => {
        const w = workout(m.workoutId);
        if (w === undefined) return null;
        return (
          <PlanRow
            key={m.id}
            mark={<DayMark kind={w.kind} filled />}
            tag={membershipTag(m, blockOfMembership(plan, m), today)}
            tagColor={m.start <= today ? colors.labelAccent : KIND_LOOK[w.kind].ink}
            name={w.name}
            meta={`${kindLabel(w.kind)} · ${membershipWhen(m)}`}
            onOpen={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } })}
            onRemove={() => void actions.deleteMembership(m.id)}
            removeLabel={t("plan.remove", { title: w.name })}
          />
        );
      })}
    </View>
  );
}

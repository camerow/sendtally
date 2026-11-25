import React from "react";
import { View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { sessionsPerWeek, usePlanPath, type Wizard } from "@sendtally/features/settings";
import { usePlan } from "@sendtally/features/training";
import { ClosingOffer } from "../../billing/ClosingOffer";
import { useBilling } from "../../billing/useBilling";
import { Button } from "../../training/components/Button";
import { Title } from "../../training/components/Title";
import { useLibrary } from "../../training/library/useLibrary";
import { WizardFrame } from "../WizardFrame";
import { WeekCard } from "./components/WeekCard";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

function MemberWeek({ api }: { api: SendtallyApi }): React.ReactElement {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const library = useLibrary().state;
  const ready = plan.status === "ready" && library.status === "ready";
  const members = ready
    ? plan.data.memberships
        .filter((m) => m.blockId !== null && m.blockId === path.blockId)
        .sort((a, b) => a.position - b.position)
    : [];
  const placed = members.flatMap((m) => {
    const workout = ready ? library.data.workout(m.workoutId) : undefined;
    return workout === undefined ? [] : [{ m, workout }];
  });
  const week = DAYS.map((d) => {
    const kinds = placed
      .filter(({ m }) => m.weekdays.includes(d))
      .map(({ workout }) => workout.kind);
    return kinds.length > 0 ? kinds : null;
  });
  return (
    <WeekCard
      week={week}
      meta={t("onboarding.plan.week.perWeek", {
        count: sessionsPerWeek(Object.fromEntries(members.map((m) => [m.id, m.weekdays]))),
      })}
      empty={t("onboarding.plan.week.empty")}
    />
  );
}

export function DoneStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const member = useBilling()?.membership.active === true;
  return (
    <WizardFrame
      wizard={wizard}
      bar={false}
      footer={
        <Button
          variant="primary"
          height={54}
          label={t("common.done")}
          onPress={() => wizard.complete(member ? "member" : "later", "plan")}
        />
      }
    >
      <View style={{ gap: 12 }}>
        <Title size={34}>{t("onboarding.plan.done.title")}</Title>
        {member ? <MemberWeek api={api} /> : <ClosingOffer api={api} />}
      </View>
    </WizardFrame>
  );
}

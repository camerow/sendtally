import React from "react";
import { View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { useMemberWeek, type Wizard } from "@sendtally/features/settings";
import { ClosingOffer } from "../../billing/ClosingOffer";
import { useBilling } from "../../billing/useBilling";
import { Button } from "../../training/components/Button";
import { Title } from "../../training/components/Title";
import { useLibrary } from "../../training/library/useLibrary";
import { WizardFrame } from "../WizardFrame";
import { WeekCard } from "./components/WeekCard";

function MemberWeek({ api }: { api: SendtallyApi }): React.ReactElement {
  const { week, sessions } = useMemberWeek(api, useLibrary().state);
  return (
    <WeekCard
      week={week}
      meta={t("onboarding.plan.week.perWeek", { count: sessions })}
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

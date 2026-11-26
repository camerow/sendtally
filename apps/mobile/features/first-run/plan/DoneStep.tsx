import React from "react";
import { View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { useOnePress, type Wizard } from "@sendtally/features/settings";
import { ClosingOffer } from "../../billing/ClosingOffer";
import { useBilling } from "../../billing/useBilling";
import { Button } from "../../training/components/Button";
import { Title } from "../../training/components/Title";
import { WizardFrame } from "../WizardFrame";
import { MemberWeek } from "./MemberWeek";

export function DoneStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const member = useBilling()?.membership.active === true;
  const once = useOnePress(true);
  return (
    <WizardFrame
      wizard={wizard}
      bar={false}
      footer={
        <Button
          variant="primary"
          height={54}
          label={t("common.done")}
          onPress={once(() => wizard.complete(member ? "member" : "later", "plan"))}
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

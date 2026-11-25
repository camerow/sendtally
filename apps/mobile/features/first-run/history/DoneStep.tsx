import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { useHistoryCard } from "@sendtally/features/settings";
import { ClosingOffer } from "../../billing/ClosingOffer";
import { useBilling } from "../../billing/useBilling";
import { Button } from "../../training/components/Button";
import { Title } from "../../training/components/Title";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { HistoryCard } from "./components/HistoryCard";

export function DoneStep({ wizard, api }: Parameters<StepComponent>[0]): React.ReactElement {
  const vm = useHistoryCard(api);
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
          onPress={() => wizard.complete(member ? "member" : "later", "log")}
        />
      }
    >
      <View style={{ gap: 12 }}>
        <Title size={34}>{t("onboarding.history.done.title")}</Title>
        {member ? (
          vm !== null && (
            <HistoryCard vm={vm} label={t("onboarding.history.card.soFar")} slim max={4} />
          )
        ) : (
          <ClosingOffer api={api} />
        )}
      </View>
    </WizardFrame>
  );
}

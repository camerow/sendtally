import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import type { Wizard } from "@sendtally/features/onboarding";
import {
  FIRST_RUN_SOURCES,
  firstRunNextLabel,
  firstRunSourceLabel,
  type FirstRunSource,
} from "@sendtally/features/settings";
import { OptionRow } from "../../components/OptionRow";
import { Button } from "../training/components/Button";
import { Title } from "../training/components/Title";
import { WizardFrame } from "./WizardFrame";

/** H1: where their climbing lives, so the next step can fetch it. */
export function LogQuestionStep({ wizard }: { wizard: Wizard }): React.ReactElement {
  const [source, setSource] = React.useState<FirstRunSource | null>(null);
  const answer = (s: FirstRunSource): void => {
    wizard.answerLog(s);
    wizard.next({ way: s === "none" ? "by_hand" : "import" });
  };
  return (
    <WizardFrame
      wizard={wizard}
      footer={
        <Button
          variant="primary"
          label={firstRunNextLabel(source)}
          onPress={() => source !== null && answer(source)}
          disabled={source === null}
        />
      }
    >
      <Title size={34}>{t("onboarding.firstRun.logQuestion")}</Title>
      <View style={{ gap: 2 }}>
        {FIRST_RUN_SOURCES.map((s) => (
          <OptionRow
            key={s}
            label={firstRunSourceLabel(s)}
            detail={s === "spreadsheet" ? "CSV" : undefined}
            mono={false}
            selected={source === s}
            onPress={() => setSource(s)}
          />
        ))}
      </View>
    </WizardFrame>
  );
}

import React from "react";
import { Button } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import {
  FIRST_RUN_SOURCES,
  firstRunNextLabel,
  firstRunSourceLabel,
  type FirstRunSource,
} from "@sendtally/features/settings";
import { Icon } from "../components/Icon";
import type { StepComponent } from "./types";
import { WizardFrame } from "./WizardFrame";

/** H1: where their climbing lives, so the next step can fetch it. */
export const LogQuestionStep: StepComponent = ({ wizard }) => {
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
          variant="azure"
          disabled={source === null}
          onClick={() => source !== null && answer(source)}
        >
          {firstRunNextLabel(source)}
        </Button>
      }
    >
      <h1 className="wizard-title">{t("onboarding.firstRun.logQuestion")}</h1>
      <div
        className="option-rows"
        role="radiogroup"
        aria-label={t("onboarding.firstRun.logQuestion")}
      >
        {FIRST_RUN_SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={source === s}
            className="option-row"
            onClick={() => setSource(s)}
          >
            <span className="wizard-option">{firstRunSourceLabel(s)}</span>
            {s === "spreadsheet" && <span className="wizard-detail">CSV</span>}
            <span className="wizard-check">
              {source === s && <Icon name="check" size={18} strokeWidth={2.4} />}
            </span>
          </button>
        ))}
      </div>
    </WizardFrame>
  );
};

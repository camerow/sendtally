import React from "react";
import { t } from "@sendtally/features/i18n";
import { stepDot, stepOn, stepRow } from "../styles";

export type Step = "choose" | "review" | "done";

const STEPS: Array<{
  step: Step;
  key: "import.stepChoose" | "import.stepReview" | "import.stepDone";
}> = [
  { step: "choose", key: "import.stepChoose" },
  { step: "review", key: "import.stepReview" },
  { step: "done", key: "import.stepDone" },
];

export function Steps({ current }: { current: Step }): React.ReactElement {
  return (
    <div style={stepRow}>
      {STEPS.map(({ step, key }, i) => (
        <React.Fragment key={step}>
          {i > 0 && <span style={stepDot} />}
          <span style={step === current ? stepOn : undefined}>{t(key)}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

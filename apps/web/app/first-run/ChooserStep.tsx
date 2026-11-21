import React from "react";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { pathDone, SAMPLE_WEEK, type OnboardingPath } from "@sendtally/features/settings";
import { DarkWeek } from "../components/DarkWeek";
import { Icon } from "../components/Icon";
import { SamplePyramid } from "../components/SamplePyramid";
import type { StepComponent } from "./types";
import { WizardFrame } from "./WizardFrame";

const WEEK = SAMPLE_WEEK.map((kind) => (kind === null ? null : [kind]));

/** Two doors, each with a small picture of what its path builds. */
export const ChooserStep: StepComponent = ({ wizard, api }) => {
  const { state } = useQuery(queries.status(api));
  const progress = state.status === "ready" ? state.data.onboarding.progress : undefined;
  const doors: { path: OnboardingPath; title: string; body: string; art: React.ReactNode }[] = [
    {
      path: "history",
      title: t("onboarding.chooser.historyTitle"),
      body: t("onboarding.chooser.historyBody"),
      art: <SamplePyramid tone="dark" />,
    },
    {
      path: "plan",
      title: t("onboarding.chooser.planTitle"),
      body: t("onboarding.chooser.planBody"),
      art: <DarkWeek week={WEEK} />,
    },
  ];
  return (
    <WizardFrame wizard={wizard} wide>
      <h1 className="wizard-title">{t("onboarding.chooser.title")}</h1>
      <div className="chooser-doors">
        {doors.map((d) => (
          <button
            key={d.path}
            type="button"
            className="chooser-door"
            onClick={() => wizard.choose(d.path, "chooser")}
          >
            <span className="chooser-art" aria-hidden="true">
              {d.art}
            </span>
            <span className="chooser-text">
              <span className="chooser-title">
                {d.title}
                <Icon name="chevron" size={18} strokeWidth={2.2} />
              </span>
              <span className="chooser-body">{d.body}</span>
              {progress !== undefined && pathDone(progress, d.path) && (
                <span className="chooser-done">{t("common.done")}</span>
              )}
            </span>
          </button>
        ))}
      </div>
      <p className="chooser-after">{t("onboarding.chooser.otherAfter")}</p>
    </WizardFrame>
  );
};

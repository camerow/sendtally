import React from "react";
import { t } from "@sendtally/features/i18n";
import type { Wizard } from "@sendtally/features/settings";
import { Icon } from "../components/Icon";

export type WizardFrameProps = {
  wizard: Wizard;
  children: React.ReactNode;
  /** The step's primary button, under the body; pinned to the foot on a phone. */
  footer?: React.ReactNode;
  /** The dark ground of a payoff screen, with its progress in gold. */
  dark?: boolean;
  /** Off on the steps past the payoff, where leaving early skips nothing. */
  skip?: boolean;
  /** Off for a closing screen with no back, progress or Skip. */
  bar?: boolean;
  /** A wider column, for a step that sets two panels side by side on a wide screen. */
  wide?: boolean;
  /** Short content sits midway between the bar and the footer, as the reveals want. */
  center?: boolean;
};

/** Every wizard step: Back and the path's progress once a path is chosen, Skip top right. */
export function WizardFrame({
  wizard,
  children,
  footer,
  dark = false,
  skip = true,
  bar = true,
  wide = false,
  center = false,
}: WizardFrameProps): React.ReactElement {
  const inPath = wizard.step !== "choose";
  const { n, total } = wizard.position;
  return (
    <div className={dark ? "wizard wizard--dark" : "wizard"}>
      <div className={wide ? "wizard-column wizard-column--wide" : "wizard-column"}>
        <header className="wizard-bar">
          {bar && inPath && wizard.canGoBack && (
            <button
              type="button"
              className="wizard-back"
              aria-label={t("common.back")}
              onClick={wizard.back}
            >
              <Icon name="back" size={22} strokeWidth={2.2} />
            </button>
          )}
          {bar && inPath && (
            <div
              role="progressbar"
              aria-label={t("onboarding.firstRun.step", { n, total })}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={n}
              className="wizard-progress"
            >
              {Array.from({ length: total }, (_, i) => (
                <i key={i} className={i < n ? "is-on" : undefined} />
              ))}
            </div>
          )}
          {bar &&
            (skip ? (
              <button type="button" className="wizard-skip" onClick={wizard.skip}>
                {t("onboarding.firstRun.skip")}
              </button>
            ) : (
              <span className="wizard-bar-end" />
            ))}
        </header>
        <main className={center ? "wizard-body wizard-body--center" : "wizard-body"}>
          {children}
        </main>
        {footer !== undefined && <div className="wizard-foot">{footer}</div>}
      </div>
    </div>
  );
}

import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Label, Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { readImportResult } from "@sendtally/features/import";
import {
  FIRST_RUN_SOURCES,
  firstRunNextLabel,
  firstRunSourceLabel,
  useFirstRunFlow,
} from "@sendtally/features/settings";
import { Icon } from "../components/Icon";
import { useAppApi } from "../lib/useAppApi";
import { usePlanActions } from "../training/data/usePlanActions";
import { useToday } from "../training/data/useToday";
import { WeekdayChips } from "../training/schedule/WeekdayChips";

/** Once per account: the log they keep already, then the days they climb, ending on Plan. */
export function FirstRunPage(): React.ReactElement {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const imported = readImportResult((k) => params.get(k)) !== null;
  const flow = useFirstRunFlow(useAppApi(), {
    imported,
    today: useToday(),
    newId: () => crypto.randomUUID(),
    actions: usePlanActions(),
    go: (to) => {
      if (to === "import") void navigate("/app/import?then=/app/start");
      else if (to === "log") void navigate("/app", { replace: true });
      else void navigate(imported ? `/app/plan?${params}` : "/app/plan", { replace: true });
    },
  });

  return (
    <div className="first-run">
      <header className="first-run-top">
        <a href="/" className="first-run-logo">
          <Logo tone="on-light" size={24} />
        </a>
        <span className="first-run-top-side">
          <Label on="light">{t("onboarding.firstRun.step", { n: flow.step, total: 2 })}</Label>
          <button type="button" className="first-run-link" onClick={flow.skip}>
            {t("onboarding.firstRun.skip")}
          </button>
        </span>
      </header>
      {flow.step === 1 ? (
        <main className="first-run-body">
          <h1 className="first-run-title">{t("onboarding.firstRun.logQuestion")}</h1>
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
                aria-checked={flow.source === s}
                className="option-row"
                onClick={() => flow.pick(s)}
              >
                <span className="first-run-option">{firstRunSourceLabel(s)}</span>
                {s === "spreadsheet" && <span className="first-run-detail">CSV</span>}
                <span className="first-run-check">
                  {flow.source === s && <Icon name="check" size={18} strokeWidth={2.4} />}
                </span>
              </button>
            ))}
          </div>
          <div className="first-run-actions">
            <Button variant="azure" disabled={flow.source === null} onClick={flow.next}>
              {firstRunNextLabel(flow.source)}
            </Button>
            <button type="button" className="first-run-link" onClick={flow.later}>
              {t("onboarding.firstRun.later")}
            </button>
          </div>
        </main>
      ) : (
        <main className="first-run-body">
          <h1 className="first-run-title">{t("onboarding.firstRun.daysQuestion")}</h1>
          <WeekdayChips days={flow.days} onToggle={flow.toggleDay} />
          <div className="first-run-actions">
            <Button variant="azure" onClick={flow.saveDays}>
              {t("onboarding.firstRun.continue")}
            </Button>
          </div>
        </main>
      )}
    </div>
  );
}

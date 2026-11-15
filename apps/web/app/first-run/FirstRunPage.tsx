import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { FirstRunAnswers } from "@sendtally/api-client";
import type { Weekday } from "@sendtally/core/hang";
import { Button, Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import {
  FIRST_RUN_SOURCES,
  firstRunNextLabel,
  firstRunSourceLabel,
  useFirstRun,
  type FirstRunSource,
} from "@sendtally/features/settings";
import { toggleIn } from "@sendtally/features/training";
import { Icon } from "../components/Icon";
import { useAppApi } from "../lib/useAppApi";
import { usePlanActions } from "../training/data/usePlanActions";
import { useToday } from "../training/data/useToday";
import { WeekdayChips } from "../training/schedule/WeekdayChips";

/** Once per account: the log they keep already, then the days they climb, ending on Plan. */
export function FirstRunPage(): React.ReactElement {
  const { finish } = useFirstRun(useAppApi());
  const actions = usePlanActions();
  const today = useToday();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const imported = params.get("imported");
  const [source, setSource] = React.useState<FirstRunSource | null>(null);
  const [onDays, setOnDays] = React.useState(false);
  const [days, setDays] = React.useState<readonly Weekday[]>([]);
  const step = onDays || imported !== null ? 2 : 1;

  const end = (endedAt: FirstRunAnswers["endedAt"], climbingDays: number): void => {
    void finish({ existingLog: source ?? "skipped", climbingDays, endedAt }).catch(() => undefined);
    if (endedAt !== "plan") return void navigate("/app", { replace: true });
    const result = new URLSearchParams(params);
    void navigate(imported === null ? "/app/plan" : `/app/plan?${result}`, { replace: true });
  };

  const saveDays = (): void => {
    if (days.length > 0)
      void actions.saveMembership({
        id: crypto.randomUUID(),
        workoutId: "climb-session",
        blockId: null,
        weekdays: [...days],
        start: today,
        position: 0,
      });
    end("plan", days.length);
  };

  const next = (): void => {
    if (source === null || source === "none") return setOnDays(true);
    void navigate("/app/import?then=/app/start");
  };

  return (
    <div className="first-run">
      <header className="first-run-top">
        <a href="/" className="first-run-logo">
          <Logo tone="on-light" size={24} />
        </a>
        <span className="first-run-top-side">
          <span className="first-run-step">
            {t("onboarding.firstRun.step", { n: step, total: 2 })}
          </span>
          <button
            type="button"
            className="first-run-link"
            onClick={() => end(step === 1 ? "skip_log" : "skip_days", 0)}
          >
            {t("onboarding.firstRun.skip")}
          </button>
        </span>
      </header>
      {step === 1 ? (
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
                aria-checked={source === s}
                className="option-row"
                onClick={() => setSource(s)}
              >
                <span className="first-run-option">{firstRunSourceLabel(s)}</span>
                {s === "spreadsheet" && <span className="first-run-detail">CSV</span>}
                <span className="first-run-check">
                  {source === s && <Icon name="check" size={18} strokeWidth={2.4} />}
                </span>
              </button>
            ))}
          </div>
          <div className="first-run-actions">
            <Button variant="azure" disabled={source === null} onClick={next}>
              {firstRunNextLabel(source)}
            </Button>
            <button type="button" className="first-run-link" onClick={() => setOnDays(true)}>
              {t("onboarding.firstRun.later")}
            </button>
          </div>
        </main>
      ) : (
        <main className="first-run-body">
          <h1 className="first-run-title">{t("onboarding.firstRun.daysQuestion")}</h1>
          <WeekdayChips days={days} onToggle={(d) => setDays(toggleIn(days, d))} />
          <div className="first-run-actions">
            <Button variant="azure" onClick={saveDays}>
              {t("onboarding.firstRun.continue")}
            </Button>
          </div>
        </main>
      )}
    </div>
  );
}

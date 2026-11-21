import React from "react";
import { Button } from "@sendtally/design";
import { formatNumber, t } from "@sendtally/features/i18n";
import { disciplineLabel } from "@sendtally/features/log-session";
import { revealLine, useHistoryCard } from "@sendtally/features/settings";
import { useTween } from "@sendtally/features/trends";
import { Pyramid } from "../../components/Pyramid";
import { PyramidLegend } from "../../components/PyramidLegend";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { DarkTile } from "./components/DarkTile";
import { HardestSend } from "./components/HardestSend";
import { YearBars } from "./components/YearBars";

/** H4: everything brought in, as one picture on the dark ground; the count runs up and the pyramid grows. */
export const RevealStep: StepComponent = ({ wizard, api }) => {
  const vm = useHistoryCard(api);
  const imported = wizard.memory.way === "import";
  const count = vm === null ? null : imported ? vm.stats.sends : vm.climbs;
  const [run, setRun] = React.useState(false);
  const counted = useTween(run ? count : null, 900);
  const seen = React.useRef(false);

  React.useEffect(() => {
    if (vm === null || seen.current) return;
    seen.current = true;
    setRun(true);
    wizard.capture("onboarding_reveal_viewed", {
      path: "history",
      sessions: vm.sessions,
      climbs: vm.climbs,
      sends: vm.stats.sends,
    });
  }, [vm, wizard]);

  return (
    <WizardFrame
      center
      wizard={wizard}
      dark
      skip={false}
      footer={<Button onClick={() => wizard.next()}>{t("onboarding.firstRun.continue")}</Button>}
    >
      {vm === null ? (
        <span className="dark-meta">{t("common.loading")}</span>
      ) : (
        <>
          <div className="reveal-head">
            <span className="dark-label">{t("onboarding.history.card.soFar")}</span>
            <div className="reveal-count">
              <span className="reveal-number">{formatNumber(Math.round(counted ?? 0))}</span>
              <span className="reveal-word">
                {imported
                  ? t("climbs.sendsWord", { count: vm.stats.sends })
                  : t("onboarding.history.reveal.climbsWord", { count: vm.climbs })}
              </span>
            </div>
            <span className="dark-meta">{revealLine(vm, imported)}</span>
          </div>
          {vm.stats.pyramid.length > 0 && (
            <div className="reveal-pyramid">
              <div className="reveal-pyramid-head">
                <span className="dark-label">{t("climbs.sendsByGrade")}</span>
                <PyramidLegend inner={t("common.sent")} outer={t("sessionDetail.notYet")} />
              </div>
              <Pyramid
                minScale={3}
                tone="dark"
                rows={vm.stats.pyramid}
                label={vm.stats.pyramid.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
              />
            </div>
          )}
          <div className="dark-tiles">
            {(imported || vm.stats.sends >= 3) && (
              <DarkTile value={vm.stats.avgSend} label={t("climbs.avgSendWord")} />
            )}
            {imported ? (
              <DarkTile
                value={vm.days}
                label={t("onboarding.history.card.daysWord", { count: vm.days })}
              />
            ) : (
              <DarkTile
                value={vm.stats.sends}
                label={t("climbs.sendsWord", { count: vm.stats.sends })}
              />
            )}
            <DarkTile value={vm.stats.flashed} label={t("climbs.flashedWord")} />
            <DarkTile
              value={vm.stats.projects}
              label={t("climbs.projectsWord", { count: vm.stats.projects })}
            />
          </div>
          {vm.stats.hardest !== null && (
            <HardestSend
              gradeLabel={vm.stats.hardest.gradeLabel}
              name={vm.stats.hardest.name ?? disciplineLabel(vm.discipline)}
              year={vm.hardestYear}
            />
          )}
          {(imported || vm.climbs >= 5) && vm.byYear.length >= 2 && <YearBars years={vm.byYear} />}
        </>
      )}
    </WizardFrame>
  );
};

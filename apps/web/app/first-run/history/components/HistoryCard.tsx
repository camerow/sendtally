import React from "react";
import { t } from "@sendtally/features/i18n";
import { disciplineLabel } from "@sendtally/features/log-session";
import {
  cardMeta,
  nextUnlock,
  type HistoryCardVM,
  type NextUnlock,
} from "@sendtally/features/settings";
import { Pyramid } from "../../../components/Pyramid";
import { PyramidGhost } from "../../../components/PyramidGhost";
import { DarkCard } from "../../components/DarkCard";
import { DarkTile } from "./DarkTile";
import { HardestSend } from "./HardestSend";
import { YearBars } from "./YearBars";

export type HistoryCardProps = {
  vm: HistoryCardVM;
  label: string;
  /** Only the pyramid: no tiles, hardest send or years. */
  slim?: boolean;
  /** At most this many grades, the rest counted under them. */
  max?: number;
  /** The foot line saying what the next climbs add, for climbs added by hand. */
  next?: boolean;
  raised?: boolean;
};

function Unlock({ next }: { next: NextUnlock }): React.ReactElement {
  if ("text" in next) return <>{next.text}</>;
  return (
    <>
      {next.before}
      <b className="unlock-more">{next.more}</b>
      {next.after}
    </>
  );
}

/** The history path's payoff card: the user's climbing as Stats draws it, on the dark ground. */
export function HistoryCard({
  vm,
  label,
  slim = false,
  max,
  next = false,
  raised = false,
}: HistoryCardProps): React.ReactElement {
  const { stats } = vm;
  const rows = max === undefined ? stats.pyramid : stats.pyramid.slice(0, max);
  const hidden = stats.pyramid.length - rows.length;
  const unlock = next ? nextUnlock(vm.climbs) : null;
  const showYears = !slim && (!next || vm.climbs >= 5) && vm.byYear.length >= 2;
  return (
    <DarkCard
      label={label}
      meta={cardMeta(vm)}
      raised={raised}
      {...(unlock === null ? {} : { note: <Unlock next={unlock} /> })}
    >
      {rows.length === 0 ? (
        <PyramidGhost />
      ) : (
        <div>
          <Pyramid
            minScale={3}
            tone="dark"
            rows={rows}
            label={rows.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
          />
          {hidden > 0 && (
            <p className="dark-meta history-more">
              {t("onboarding.history.card.moreGrades", { count: hidden })}
            </p>
          )}
        </div>
      )}
      {!slim && vm.climbs > 0 && (
        <>
          <div className="dark-tiles">
            <DarkTile
              compact={raised}
              value={next && vm.climbs < 3 ? null : stats.avgSend}
              label={t("climbs.avgSendWord")}
            />
            <DarkTile
              compact={raised}
              value={stats.sends}
              label={t("climbs.sendsWord", { count: stats.sends })}
            />
            <DarkTile compact={raised} value={stats.flashed} label={t("climbs.flashedWord")} />
            <DarkTile
              compact={raised}
              value={stats.projects}
              label={t("climbs.projectsWord", { count: stats.projects })}
            />
          </div>
          {stats.hardest !== null && (
            <HardestSend
              gradeLabel={stats.hardest.gradeLabel}
              name={stats.hardest.name ?? disciplineLabel(vm.discipline)}
              year={vm.hardestYear}
            />
          )}
        </>
      )}
      {showYears && <YearBars years={vm.byYear} compact={raised} />}
    </DarkCard>
  );
}

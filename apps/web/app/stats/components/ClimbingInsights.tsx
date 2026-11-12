import React from "react";
import {
  CLIMB_PLACES,
  climbingInsightsVM,
  daysClimbed,
  mainDiscipline,
  useClimbs,
  workoutClimbSessions,
  type ClimbPlaceFilter,
} from "@sendtally/features/climbs";
import { useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { disciplineLabel, type Discipline } from "@sendtally/features/log-session";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import type { TrendRange } from "@sendtally/features/trends";
import { GradeBadge } from "../../climbs/components/GradeBadge";
import { Segmented } from "../../components/Segmented";
import { useAppApi } from "../../lib/useAppApi";
import { ClimbsByGrade } from "./ClimbsByGrade";
import { CountTile } from "./CountTile";
import { DaysClimbing } from "./DaysClimbing";
import { Pyramid } from "./Pyramid";

const PLACE_LABELS: Record<ClimbPlaceFilter, () => string> = {
  all: () => t("trends.scopeAll"),
  outdoor: () => t("trends.outside"),
  indoor: () => t("climbs.gym"),
};

/**
 * The pyramid of what was sent, the climbs at each grade, the average send, sends, flashes and
 * projects, the days climbed and the top send, counting climbs logged in workouts too.
 */
export function ClimbingInsights({ range }: { range: TrendRange }): React.ReactElement {
  const api = useAppApi();
  const { state } = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const [discipline, setDiscipline] = React.useState<Discipline | null>(null);
  const [place, setPlace] = React.useState<ClimbPlaceFilter>("all");
  const gymList = useGyms(api).state;
  const gyms = React.useMemo(
    () => new Map(gymList.status === "ready" ? gymList.data.map((g) => [g.id, g.name]) : []),
    [gymList]
  );
  const ready = state.status === "ready" ? state.data : null;
  const sessions = React.useMemo(
    () => (ready === null ? [] : [...ready.sessions, ...workoutClimbSessions(ready.activities)]),
    [ready]
  );
  const shownDiscipline = discipline ?? mainDiscipline(sessions);
  const vm = React.useMemo(
    () =>
      ready === null
        ? null
        : climbingInsightsVM(sessions, ready.climbs, {
            range,
            discipline: shownDiscipline,
            place,
            scales,
            gyms,
          }),
    [ready, sessions, range, shownDiscipline, place, scales, gyms]
  );
  const days = React.useMemo(() => daysClimbed(sessions, range), [sessions, range]);

  return (
    <>
      <div className="stats-filters">
        <div style={{ flex: 2 }}>
          <Segmented
            soft
            label={t("climbs.discipline")}
            value={shownDiscipline}
            onChange={setDiscipline}
            options={(["boulder", "route"] as const).map((d) => ({
              value: d,
              label: disciplineLabel(d),
            }))}
          />
        </div>
        <div style={{ flex: CLIMB_PLACES.length }}>
          <Segmented
            soft
            label={t("climbs.where")}
            value={place}
            onChange={setPlace}
            options={CLIMB_PLACES.map((p) => ({ value: p, label: PLACE_LABELS[p]() }))}
          />
        </div>
      </div>
      {vm === null ? (
        <span className={state.status === "error" ? "stats-error" : "load-state-loading"}>
          {state.status === "error" ? t("climbs.loadFailed") : t("common.loading")}
        </span>
      ) : (
        <div className="stats-grid">
          <section className="stats-card">
            <div className="stats-card-head">
              <h2 className="stats-label">{t("climbs.sendsByGrade")}</h2>
              <span className="pyramid-legend">
                <span className="pyramid-key">
                  <span className="pyramid-swatch" />
                  {t("common.sent")}
                </span>
                <span className="pyramid-key">
                  <span className="pyramid-swatch pyramid-swatch--soft" />
                  {t("sessionDetail.notYet")}
                </span>
              </span>
            </div>
            {vm.pyramid.length === 0 ? (
              <p className="stats-empty">{t("climbs.insightsEmpty")}</p>
            ) : (
              <Pyramid
                rows={vm.pyramid}
                label={vm.pyramid.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
              />
            )}
          </section>
          {vm.byGrade.length > 0 && <ClimbsByGrade grades={vm.byGrade} />}
          <div className="stats-wide">
            <div className="count-tiles">
              <CountTile value={vm.avgSend ?? "–"} label={t("climbs.avgSendWord")} />
              <CountTile value={vm.sends} label={t("climbs.sendsWord", { count: vm.sends })} />
              <CountTile value={vm.flashed} label={t("climbs.flashedWord")} />
              <CountTile
                value={vm.projects}
                label={t("climbs.projectsWord", { count: vm.projects })}
              />
            </div>
          </div>
          <div className="stats-wide">
            <DaysClimbing vm={days} />
          </div>
          {vm.hardest !== null && (
            <div className="stats-wide hardest-send">
              <GradeBadge label={vm.hardest.gradeLabel} />
              <span className="hardest-send-name">
                {vm.hardest.name ?? t("climbs.hardestSend")}
              </span>
              <span className="stats-meta">{vm.hardest.dateLabel}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

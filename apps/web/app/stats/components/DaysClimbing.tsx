import React from "react";
import type { ClimbingDay, DaysClimbedVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";

/** A square a day over the range, a column a week from the latest back: outside, gym or rest. */
export function DaysClimbing({ vm }: { vm: DaysClimbedVM }): React.ReactElement {
  const scroll = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = scroll.current;
    if (el !== null) el.scrollLeft = el.scrollWidth;
  }, [vm]);
  const legend: [ClimbingDay, string][] = [
    ["outside", t("climbs.daysOutsideCount", { count: vm.outside })],
    ["gym", t("climbs.daysGymCount", { count: vm.gym })],
    ["rest", t("climbs.daysRest")],
  ];
  const strip = vm.strip.length > 0;
  return (
    <section className="stats-card days-climbing">
      <h2 className="stats-label">{t("climbs.daysClimbing")}</h2>
      <div className={strip ? "days-body" : "days-body days-body--grid"}>
        {strip ? (
          <div className="days-strip" role="img" aria-label={vm.label}>
            {vm.strip.map((s, i) => (
              <span key={i} className="days-strip-day">
                <span className={`days-square days-square--big day-${s.day}`} />
                <span className="days-tiny">{s.weekday}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="days-grid" role="img" aria-label={vm.label}>
            <div className="days-col days-weekdays">
              {vm.weekdays.map((d, i) => (
                <span key={i} className="days-tiny">
                  {d}
                </span>
              ))}
            </div>
            <div className="days-weeks" ref={scroll}>
              {vm.weeks.map((w, i) => (
                <div key={i} className="days-col">
                  <span className="days-tiny days-month">{w.month}</span>
                  {w.days.map((d, j) => (
                    <span key={j} className={`days-square day-${d}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={strip ? "days-legend days-legend--row" : "days-legend"}>
          {legend.map(([day, label]) => (
            <span key={day} className={day === "rest" ? "days-key days-key--muted" : "days-key"}>
              <span className={`days-swatch day-${day}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

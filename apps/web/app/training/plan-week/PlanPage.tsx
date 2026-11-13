import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  addDays,
  daysBetween,
  isCalendarDate,
  weekStart,
  weekday,
  type CalendarDate,
} from "@sendtally/core/hang";
import { Logo } from "@sendtally/design";
import { longDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockGroups,
  blockMembers,
  trainingWeek,
  useTrainingLog,
} from "@sendtally/features/training";
import { AccountButton } from "../../components/AccountButton";
import { PageAction } from "../../components/PageAction";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { BlockRow } from "../blocks/BlockRow";
import { blockPath } from "../blocks/paths";
import { useHangData } from "../data/HangDataContext";
import { AddWorkoutsSheet } from "./AddWorkoutsSheet";
import { DaySection } from "./DaySection";
import { WeekStrip } from "./WeekStrip";

const weekOffset = (today: CalendarDate, date: CalendarDate): number =>
  daysBetween(weekStart(today), weekStart(date)) / 7;

/** Room left between the stuck strip and the day scrolled up under it. */
const UNDER_STRIP = 12;

/**
 * The training home: a week of training, logged and planned, day by day, opening on Today
 * (or the day asked for) with the week strip stuck above it.
 */
export function PlanPage(): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useAppApi());
  const [params] = useSearchParams();
  const asked = params.get("date");
  const start = asked !== null && isCalendarDate(asked) ? asked : today;
  const [offset, setOffset] = React.useState(() => weekOffset(today, start));
  const [selected, setSelected] = React.useState<CalendarDate>(start);
  const [adding, setAdding] = React.useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const strip = React.useRef<HTMLDivElement>(null);
  const days = React.useRef(new Map<CalendarDate, HTMLElement>());
  const target = React.useRef<CalendarDate | null>(start);

  const scrollTo = React.useCallback((date: CalendarDate, smooth: boolean): void => {
    const el = days.current.get(date);
    const stuck = strip.current?.getBoundingClientRect().height ?? 0;
    if (el === undefined) return;
    const top = el.getBoundingClientRect().top + window.scrollY - stuck - UNDER_STRIP;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  }, []);

  const monday = addDays(weekStart(today), offset * 7);
  const week = trainingWeek(log, monday, today);
  const running = blockGroups(log.plan.blocks, today).current;

  // The day to hold under the strip while the list fills in, until the user scrolls.
  const page = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = page.current;
    if (el === null) return;
    const hold = (): void => {
      if (target.current !== null) scrollTo(target.current, false);
    };
    const release = (): void => {
      target.current = null;
    };
    hold();
    const observer = new ResizeObserver(hold);
    observer.observe(el);
    const events = ["wheel", "touchmove", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, release, { passive: true }));
    return () => {
      observer.disconnect();
      events.forEach((e) => window.removeEventListener(e, release));
    };
  }, [offset, scrollTo]);

  const select = (date: CalendarDate): void => {
    setSelected(date);
    target.current = null;
    scrollTo(date, true);
  };
  const show = (date: CalendarDate): void => {
    setOffset(weekOffset(today, date));
    setSelected(date);
    target.current = date;
    scrollTo(date, true);
  };
  const changeWeek = (next: number): void => {
    setOffset(next);
    const day = addDays(addDays(weekStart(today), next * 7), weekday(selected));
    setSelected(day);
    target.current = day;
  };

  return (
    <div className="plan" ref={page}>
      <div className="sessions-head">
        <span className="sessions-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="sessions-title">{t("plan.tab")}</h1>
        <div style={{ flex: 1 }} />
        <PageAction label={t("plan.schedule")} onPress={() => setAdding(true)} />
        <AccountButton />
      </div>
      <span className="plan-label">{longDate(today)}</span>
      <div className="plan-strip" ref={strip}>
        <WeekStrip
          offset={offset}
          days={week}
          selected={selected}
          onSelect={select}
          onOffset={changeWeek}
        />
      </div>
      {running.length > 0 && (
        <div className="plan-blocks">
          <span className="plan-label plan-label--muted">
            {t("plan.blocksInProgress", { count: running.length })}
          </span>
          {running.map((b) => (
            <BlockRow
              key={b.id}
              id={b.id}
              name={b.name}
              meta={t("plan.workoutCount", { count: blockMembers(log.plan, b).length })}
            />
          ))}
        </div>
      )}
      {week.map((d, i) => (
        <div
          key={d.date}
          ref={(el) => {
            if (el === null) days.current.delete(d.date);
            else days.current.set(d.date, el);
          }}
          className={i === week.length - 1 ? "plan-day-slot plan-day-slot--last" : "plan-day-slot"}
        >
          <DaySection day={d} />
        </div>
      ))}
      {adding && (
        <AddWorkoutsSheet
          flow={{ date: selected, blockId: null }}
          onClose={(added) => {
            setAdding(false);
            if (added.length > 0) select(selected);
          }}
          onScheduled={(made) => {
            toast.show({
              message: t("plan.scheduledName", { name: made.name }),
              action: {
                label: t("plan.viewTemplate"),
                onPress: () => void navigate(blockPath(made.id)),
              },
            });
            show(made.start);
          }}
        />
      )}
    </div>
  );
}

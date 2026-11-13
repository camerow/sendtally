import React from "react";
import { useNavigate } from "react-router";
import {
  blockEnded,
  blockLastDay,
  blockWeekOn,
  isDated,
  maxDate,
  type Block,
} from "@sendtally/core/hang";
import { daysList, shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockDates,
  newSchedule,
  nextPosition,
  scheduledMemberships,
  scheduleReady,
  toggled,
  usePlan,
  type AddFlow,
  type ScheduleDraft,
  type ScheduleMode,
} from "@sendtally/features/training";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { Segmented } from "../../components/Segmented";
import { useAppApi } from "../../lib/useAppApi";
import { MonthCalendar } from "../components/MonthCalendar";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { usePlanActions } from "../data/usePlanActions";
import { useLibrary, workoutPath } from "../library/useLibrary";
import { BlockChoice } from "./BlockChoice";
import { StartField } from "./StartField";
import { WeekdayChips } from "./WeekdayChips";

function addLabel(d: ScheduleDraft, count: number, first: string | undefined): string {
  if (d.mode === "repeat")
    return d.weekdays.length === 0
      ? t("hang.add")
      : t("plan.addEvery", { days: daysList(d.weekdays) });
  if (count === 1 && first !== undefined) return t("plan.addOn", { date: shortDate(first) });
  return count === 0 ? t("hang.add") : t("plan.addOnDays", { count });
}

/** The last step of adding to the plan: every week on some days, or on some dates, in a block or not. */
export function SchedulePage({
  workoutId,
  flow,
}: {
  workoutId: string;
  flow: AddFlow;
}): React.ReactElement | null {
  const navigate = useNavigate();
  const { today } = useHangData();
  const library = useLibrary();
  const plan = usePlan(useAppApi()).state;
  const actions = usePlanActions();
  const [draft, setDraft] = React.useState(() => newSchedule(flow.date, today));
  const [blockId, setBlockId] = React.useState(flow.blockId);
  const update = (patch: Partial<ScheduleDraft>): void => setDraft((d) => ({ ...d, ...patch }));

  if (library.state.status !== "ready")
    return <LoadState state={library.state} onRetry={() => void library.reload()} />;
  const workout = library.state.data.workout(workoutId);
  if (workout === undefined) return null;
  const all = plan.status === "ready" ? plan.data.blocks : [];
  const template = all.find((b) => b.id === flow.blockId && !isDated(b));
  const blocks =
    template === undefined ? all.filter(isDated).filter((b) => !blockEnded(b, today)) : [];
  const block: Block | null = template ?? blocks.find((b) => b.id === blockId) ?? null;
  const dated = block !== null && isDated(block) ? block : null;
  const planned = scheduledMemberships(draft, workoutId, block, () => "", 0);
  // In a block the dates are one plan's days; outside one, a plan each.
  const days =
    draft.mode === "dates" && dated !== null
      ? draft.dates.filter((d) => blockWeekOn(dated, d) !== null).sort()
      : planned.map((m) => m.start);

  const save = (): void => {
    const position = plan.status === "ready" ? nextPosition(plan.data, block?.id ?? null) : 0;
    const memberships = scheduledMemberships(
      draft,
      workoutId,
      block,
      () => crypto.randomUUID(),
      position
    );
    memberships.forEach((m) => void actions.saveMembership(m));
    const [first] = memberships;
    if (first === undefined) return;
    if (draft.mode === "dates" && dated !== null)
      void actions.saveSchedule(blockDates(first.id, dated, draft.dates));
    void navigate(`/app/plan?date=${days[0] ?? first.start}`);
  };

  return (
    <DetailFrame
      backTo={workoutPath(workoutId)}
      footer={
        <button
          type="button"
          className="detail-primary"
          disabled={!scheduleReady(draft, block)}
          onClick={save}
        >
          {addLabel(draft, days.length, days[0])}
        </button>
      }
    >
      <div className="schedule-head">
        <span className="plan-label">{workout.name}</span>
        <h1 className="schedule-title">{t("plan.howOften")}</h1>
      </div>
      {template === undefined && (
        <Segmented<ScheduleMode>
          label={t("plan.howOften")}
          value={draft.mode}
          onChange={(mode) => update({ mode })}
          options={[
            { value: "repeat", label: t("plan.repeatEvery") },
            { value: "dates", label: t("plan.specificDays") },
          ]}
        />
      )}
      {draft.mode === "repeat" ? (
        <section className="schedule-section">
          <h2 className="plan-label plan-label--muted">{t("plan.days")}</h2>
          <WeekdayChips
            days={draft.weekdays}
            onToggle={(day) => update({ weekdays: toggled(draft.weekdays, day) })}
          />
        </section>
      ) : (
        <MonthCalendar
          key={block?.id ?? "none"}
          selected={draft.dates[0] ?? maxDate(block?.start ?? today, today)}
          picked={draft.dates}
          min={maxDate(block?.start ?? today, today)}
          max={dated === null ? undefined : blockLastDay(dated)}
          today={today}
          blocks={blocks}
          onPick={(d) => update({ dates: toggled(draft.dates, d) })}
        />
      )}
      {blocks.length > 0 && (
        <BlockChoice blocks={blocks} value={block?.id ?? null} onChange={setBlockId} />
      )}
      {block === null && draft.mode === "repeat" && (
        <StartField value={draft.start} min={today} onChange={(start) => update({ start })} />
      )}
    </DetailFrame>
  );
}

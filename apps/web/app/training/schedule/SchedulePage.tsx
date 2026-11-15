import React from "react";
import { useNavigate } from "react-router";
import { t } from "@sendtally/features/i18n";
import {
  newSchedule,
  nextPosition,
  scheduledMemberships,
  scheduleReady,
  toggled,
  usePlan,
  type ScheduleDraft,
  type ScheduleMode,
  scheduleAddLabel,
} from "@sendtally/features/training";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { Segmented } from "../../components/Segmented";
import { useAppApi } from "../../lib/useAppApi";
import { MonthCalendar } from "../components/MonthCalendar";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { usePlanActions } from "../data/usePlanActions";
import { useLibrary, workoutPath } from "../library/useLibrary";
import { StartField } from "./StartField";
import { WeekdayChips } from "./WeekdayChips";

/** Scheduling a workout outside any block: every week on some days, or on some dates. */
export function SchedulePage({ workoutId }: { workoutId: string }): React.ReactElement | null {
  const navigate = useNavigate();
  const { today } = useHangData();
  const library = useLibrary();
  const plan = usePlan(useAppApi()).state;
  const actions = usePlanActions();
  const [draft, setDraft] = React.useState(() => newSchedule(null, today));
  const update = (patch: Partial<ScheduleDraft>): void => setDraft((d) => ({ ...d, ...patch }));

  if (library.state.status !== "ready")
    return <LoadState state={library.state} onRetry={() => void library.reload()} />;
  const workout = library.state.data.workout(workoutId);
  if (workout === undefined) return null;
  const days = scheduledMemberships(draft, workoutId, () => "", 0).map((m) => m.start);

  const save = (): void => {
    const position = plan.status === "ready" ? nextPosition(plan.data, null) : 0;
    const memberships = scheduledMemberships(draft, workoutId, () => crypto.randomUUID(), position);
    memberships.forEach((m) => void actions.saveMembership(m));
    const [first] = memberships;
    if (first === undefined) return;
    void navigate(`/app/plan?date=${first.start}`);
  };

  return (
    <DetailFrame
      backTo={workoutPath(workoutId)}
      footer={
        <button
          type="button"
          className="detail-primary"
          disabled={!scheduleReady(draft)}
          onClick={save}
        >
          {scheduleAddLabel(draft, days.length, days[0])}
        </button>
      }
    >
      <div className="schedule-head">
        <span className="plan-label">{workout.name}</span>
        <h1 className="schedule-title">{t("plan.howOften")}</h1>
      </div>
      <Segmented<ScheduleMode>
        label={t("plan.howOften")}
        value={draft.mode}
        onChange={(mode) => update({ mode })}
        options={[
          { value: "repeat", label: t("plan.repeatEvery") },
          { value: "dates", label: t("plan.specificDays") },
        ]}
      />
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
          selected={draft.dates[0] ?? today}
          picked={draft.dates}
          min={today}
          today={today}
          onPick={(d) => update({ dates: toggled(draft.dates, d) })}
        />
      )}
      {draft.mode === "repeat" && (
        <StartField value={draft.start} min={today} onChange={(start) => update({ start })} />
      )}
    </DetailFrame>
  );
}

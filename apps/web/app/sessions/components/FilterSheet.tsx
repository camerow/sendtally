import React from "react";
import { FOCI, type WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { CLIMB_STATUSES } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import {
  LOG_CATEGORIES,
  LOG_DISCIPLINES,
  LOG_ROW_TYPES,
  outcomeChipLabel,
  NO_LOG_FILTER,
  filterLog,
  logOutcomeCounts,
  logRowTypeLabel,
  logViewCountLabel,
  showsType,
  updateLogFilter,
  type LogContext,
  type LogFilter,
  type LogItem,
  type LogOption,
} from "@sendtally/features/journal";
import { disciplineLabel } from "@sendtally/features/log-session";
import type { TagOption } from "@sendtally/features/sessions";
import { focusLabel } from "@sendtally/features/training";
import { trendRanges, trendRangeLabel } from "@sendtally/features/trends";
import { FilterChip } from "../../components/FilterChip";
import { Sheet } from "../../components/Sheet";
import { GradePicker } from "../../climbs/components/GradePicker";
import { CategoryMark } from "../../training/components/CategoryMark";
import { DayMark } from "../../training/plan-week/DayMark";
import { EffortStrip } from "./EffortStrip";

export type FilterChoices = {
  years: readonly number[];
  tags: readonly TagOption[];
  places: readonly LogOption[];
  exercises: readonly LogOption[];
  blocks: readonly LogOption[];
  workouts: readonly LogOption[];
};

function Field({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="filter-field">
      <span className="field-label">{title}</span>
      {children}
    </div>
  );
}

function GroupHeading({ title, kind }: { title: string; kind?: WorkoutKind }): React.ReactElement {
  return (
    <h3 className="filter-group">
      {kind !== undefined && <CategoryMark kind={kind} size={24} />}
      {title}
    </h3>
  );
}

function Picker({
  title,
  any,
  value,
  options,
  onPick,
}: {
  title: string;
  any: string;
  value: string | null;
  options: readonly LogOption[];
  onPick: (key: string | null) => void;
}): React.ReactElement {
  return (
    <select
      className={value === null ? "form-input form-input--any" : "form-input"}
      aria-label={title}
      value={value ?? ""}
      onChange={(e) => onPick(e.target.value === "" ? null : e.target.value)}
    >
      <option value="">{any}</option>
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

const toggled = <T,>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function FilterSheet({
  open,
  items,
  ctx,
  choices,
  filter,
  onApply,
  onClose,
}: {
  open: boolean;
  items: readonly LogItem[];
  ctx: LogContext;
  choices: FilterChoices;
  filter: LogFilter;
  onApply: (filter: LogFilter) => void;
  onClose: () => void;
}): React.ReactElement {
  const [draft, setDraft] = React.useState<LogFilter>(filter);
  const [wasOpen, setWasOpen] = React.useState(open);
  const resetDraftOnOpen = (): void => {
    setWasOpen(open);
    if (open) setDraft(filter);
  };
  if (open !== wasOpen) resetDraftOnOpen();

  const set = (patch: Partial<LogFilter>): void => setDraft((d) => updateLogFilter(d, patch));
  const shown = React.useMemo(
    () => (open ? logViewCountLabel(filterLog(items, draft, ctx)) : ""),
    [open, items, draft, ctx]
  );
  const counts = React.useMemo(
    () => (open ? logOutcomeCounts(items, draft, ctx) : null),
    [open, items, draft, ctx]
  );

  return (
    <Sheet
      open={open}
      title={t("common.filters")}
      under={
        <button
          type="button"
          className="filter-clear filter-clear--head"
          onClick={() => setDraft({ ...NO_LOG_FILTER, search: draft.search })}
        >
          {t("common.clear")}
        </button>
      }
      onClose={onClose}
      action={{
        label: t("sessions.showCount", { label: shown.toLowerCase() }),
        onPress: () => onApply(draft),
      }}
    >
      <div className="log-filters">
        <Field title={t("journal.show")}>
          <div className="grade-presets">
            {LOG_ROW_TYPES.map((type) => (
              <FilterChip
                key={type}
                upper
                label={logRowTypeLabel(type)}
                active={draft.show.includes(type)}
                onPress={() => set({ show: toggled(draft.show, type) })}
              />
            ))}
          </div>
        </Field>
        <Field title={t("sessions.when")}>
          <div className="chip-row log-filters-when">
            {trendRanges(choices.years).map((range) => (
              <FilterChip
                key={range}
                upper
                label={trendRangeLabel(range)}
                active={draft.when === range}
                onPress={() => set({ when: range })}
              />
            ))}
          </div>
        </Field>
        <Field title={t("common.effort")}>
          <EffortStrip value={draft.effort} onChange={(effort) => set({ effort })} />
        </Field>
        {choices.tags.length > 0 && (
          <Field title={t("common.tags")}>
            <div className="grade-presets">
              {choices.tags.map((tag) => (
                <FilterChip
                  key={tag.slug}
                  label={tag.name}
                  active={draft.tags.includes(tag.slug)}
                  onPress={() => set({ tags: toggled(draft.tags, tag.slug) })}
                />
              ))}
            </div>
          </Field>
        )}

        {showsType(draft, "climbing") && (
          <>
            <GroupHeading title={t("statistics.climbing")} kind="climbing" />
            <Field title={t("climbs.discipline")}>
              <div className="grade-presets">
                {LOG_DISCIPLINES.map((d) => (
                  <FilterChip
                    key={d}
                    upper
                    label={disciplineLabel(d)}
                    active={draft.discipline === d}
                    onPress={() =>
                      set({ discipline: draft.discipline === d ? null : d, grade: null })
                    }
                  />
                ))}
              </div>
            </Field>
            {draft.discipline !== null && (
              <Field title={t("common.grade")}>
                <GradePicker
                  key={draft.discipline}
                  scale={ctx.scales[draft.discipline]}
                  value={draft.grade}
                  climbs={ctx.climbs}
                  onChange={(grade) => set({ grade })}
                />
              </Field>
            )}
            <Field title={t("sessions.outcome")}>
              <div className="grade-presets">
                {CLIMB_STATUSES.map((s) => (
                  <FilterChip
                    key={s}
                    label={outcomeChipLabel(s, counts?.[s] ?? 0)}
                    active={draft.outcome === s}
                    onPress={() => set({ outcome: s })}
                  />
                ))}
              </div>
            </Field>
            <Field title={t("climbs.where")}>
              <div className="grade-presets">
                {(["indoor", "outdoor"] as const).map((s) => (
                  <FilterChip
                    key={s}
                    upper
                    label={t(s === "indoor" ? "common.indoor" : "common.outdoor")}
                    active={draft.setting === s}
                    onPress={() => set({ setting: draft.setting === s ? null : s })}
                  />
                ))}
              </div>
              <Picker
                title={t("climbs.where")}
                any={t("sessions.anyPlace")}
                value={draft.place}
                options={choices.places}
                onPick={(place) => set({ place })}
              />
            </Field>
          </>
        )}

        {showsType(draft, "training") && (
          <>
            <GroupHeading title={t("statistics.training")} kind="strength" />
            <Field title={t("workouts.category")}>
              <div className="grade-presets">
                {LOG_CATEGORIES.map((kind) => (
                  <FilterChip
                    key={kind}
                    upper
                    label={kindLabel(kind)}
                    leading={<DayMark kind={kind} filled />}
                    active={draft.categories.includes(kind)}
                    onPress={() => set({ categories: toggled(draft.categories, kind) })}
                  />
                ))}
              </div>
            </Field>
            <Field title={t("sessions.exercise")}>
              <Picker
                title={t("sessions.exercise")}
                any={t("sessions.anyExercise")}
                value={draft.exercise}
                options={choices.exercises}
                onPick={(exercise) => set({ exercise })}
              />
            </Field>
          </>
        )}

        <GroupHeading title={t("sessions.fromYourPlan")} />
        <Field title={t("plan.block")}>
          <Picker
            title={t("plan.block")}
            any={t("sessions.anyBlock")}
            value={draft.block}
            options={choices.blocks}
            onPick={(block) => set({ block })}
          />
        </Field>
        <Field title={t("plan.workout")}>
          <Picker
            title={t("plan.workout")}
            any={t("sessions.anyWorkout")}
            value={draft.workout}
            options={choices.workouts}
            onPick={(workout) => set({ workout })}
          />
        </Field>
        <Field title={t("focus.label")}>
          <div className="grade-presets">
            {FOCI.map((focus) => (
              <FilterChip
                key={focus}
                upper
                label={focusLabel(focus)}
                active={draft.foci.includes(focus)}
                onPress={() => set({ foci: toggled(draft.foci, focus) })}
              />
            ))}
          </div>
        </Field>
      </div>
    </Sheet>
  );
}

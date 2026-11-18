import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Discipline } from "@sendtally/core";
import { FOCI, type WorkoutKind } from "@sendtally/core/hang";
import { CLIMB_STATUSES, type ClimbStatusFilter } from "@sendtally/features/climbs";
import { t, type MessageKey } from "@sendtally/features/i18n";
import {
  LOG_ROW_TYPES,
  filterLog,
  logOutcomeCounts,
  logRowTypeLabel,
  logViewCountLabel,
  NO_LOG_FILTER,
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
import { kindLabel } from "@sendtally/features/activities";
import { trendRanges, trendRangeLabel } from "@sendtally/features/trends";
import { colors, fonts } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { OptionRow } from "../../components/OptionRow";
import { SelectRow } from "../../components/SelectRow";
import { Sheet } from "../../components/Sheet";
import { press } from "../../lib/press";
import { GradePicker } from "../climbs/GradePicker";
import { CategoryMark } from "../training/library/CategoryMark";
import { DayMark } from "../training/today/DayMark";
import { Button } from "../training/components/Button";
import { EffortStrip } from "./EffortStrip";

const STATUS_LABELS: Record<ClimbStatusFilter, MessageKey> = {
  all: "climbs.statusAll",
  projects: "climbs.statusProjects",
  sent: "climbs.statusSent",
  notYet: "climbs.statusNotYet",
};

const CATEGORIES: readonly WorkoutKind[] = [
  "climbing",
  "hangboard",
  "strength",
  "mobility",
  "other",
];

const DISCIPLINES: readonly Discipline[] = ["boulder", "route"];

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  lineHeight: 13,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textMuted,
} as const;

export type FilterChoices = {
  years: readonly number[];
  tags: readonly TagOption[];
  places: readonly LogOption[];
  exercises: readonly LogOption[];
  blocks: readonly LogOption[];
  workouts: readonly LogOption[];
};

export type FilterSheetProps = {
  visible: boolean;
  items: readonly LogItem[];
  ctx: LogContext;
  choices: FilterChoices;
  filter: LogFilter;
  onApply: (filter: LogFilter) => void;
  onClose: () => void;
};

function Field({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={{ gap: 9 }}>
      <Text style={label}>{title}</Text>
      {children}
    </View>
  );
}

function Chips({ children }: { children: React.ReactNode }): React.ReactElement {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}

function GroupHeading({ title, kind }: { title: string; kind?: WorkoutKind }): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colors.lineOnLightSoft,
      }}
    >
      {kind !== undefined && <CategoryMark kind={kind} size={24} />}
      <Text
        accessibilityRole="header"
        style={{ fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.gunmetal }}
      >
        {title}
      </Text>
    </View>
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
  const picked = options.find((o) => o.key === value);
  return (
    <SelectRow label={title} value={picked?.name ?? any} muted={picked === undefined}>
      {(close) =>
        [{ key: null, name: any }, ...options].map((o) => (
          <OptionRow
            key={o.key ?? "any"}
            label={o.name}
            mono={false}
            selected={o.key === (picked?.key ?? null)}
            onPress={() => {
              onPick(o.key);
              close();
            }}
          />
        ))
      }
    </SelectRow>
  );
}

const toggled = <T,>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function FilterSheet({
  visible,
  items,
  ctx,
  choices,
  filter,
  onApply,
  onClose,
}: FilterSheetProps): React.ReactElement {
  const [draft, setDraft] = React.useState<LogFilter>(filter);

  const [wasVisible, setWasVisible] = React.useState(visible);
  const resetDraftOnOpen = (): void => {
    setWasVisible(visible);
    if (visible) setDraft(filter);
  };
  if (visible !== wasVisible) resetDraftOnOpen();

  const set = (patch: Partial<LogFilter>): void => setDraft((d) => updateLogFilter(d, patch));
  const shown = React.useMemo(
    () => (visible ? logViewCountLabel(filterLog(items, draft, ctx)) : ""),
    [visible, items, draft, ctx]
  );
  const counts = React.useMemo(
    () => (visible ? logOutcomeCounts(items, draft, ctx) : null),
    [visible, items, draft, ctx]
  );
  const climbs = showsType(draft, "climbing");
  const training = showsType(draft, "training");

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel={t("common.closeFilters")}
      footer={
        <Button
          label={t("sessions.showCount", { label: shown.toLowerCase() })}
          onPress={() => onApply(draft)}
          variant="primary"
        />
      }
    >
      <View style={{ gap: 18, paddingTop: 2, paddingHorizontal: 18, paddingBottom: 18 }}>
        <View
          style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              letterSpacing: -0.5,
              color: colors.gunmetal,
            }}
          >
            {t("common.filters")}
          </Text>
          <Pressable
            onPress={() => setDraft({ ...NO_LOG_FILTER, search: draft.search })}
            accessibilityRole="button"
            hitSlop={8}
            style={press({})}
          >
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                letterSpacing: 0.66,
                textTransform: "uppercase",
                color: colors.azureInk,
              }}
            >
              {t("common.clear")}
            </Text>
          </Pressable>
        </View>

        <Field title={t("journal.show")}>
          <Chips>
            {LOG_ROW_TYPES.map((type) => (
              <Chip
                key={type}
                label={logRowTypeLabel(type)}
                active={draft.show.includes(type)}
                onPress={() => set({ show: toggled(draft.show, type) })}
              />
            ))}
          </Chips>
        </Field>
        <Field title={t("sessions.when")}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -18 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 18 }}
          >
            {trendRanges(choices.years).map((range) => (
              <Chip
                key={range}
                label={trendRangeLabel(range)}
                active={draft.when === range}
                onPress={() => set({ when: range })}
              />
            ))}
          </ScrollView>
        </Field>
        <Field title={t("common.effort")}>
          <EffortStrip value={draft.effort} onChange={(effort) => set({ effort })} />
        </Field>
        {choices.tags.length > 0 && (
          <Field title={t("common.tags")}>
            <Chips>
              {choices.tags.map((tag) => (
                <Chip
                  key={tag.slug}
                  label={tag.name}
                  uppercase={false}
                  active={draft.tags.includes(tag.slug)}
                  onPress={() => set({ tags: toggled(draft.tags, tag.slug) })}
                />
              ))}
            </Chips>
          </Field>
        )}

        {climbs && (
          <>
            <GroupHeading title={t("statistics.climbing")} kind="climbing" />
            <Field title={t("climbs.discipline")}>
              <Chips>
                {DISCIPLINES.map((d) => (
                  <Chip
                    key={d}
                    label={disciplineLabel(d)}
                    active={draft.discipline === d}
                    onPress={() =>
                      set({ discipline: draft.discipline === d ? null : d, grade: null })
                    }
                  />
                ))}
              </Chips>
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
              <Chips>
                {CLIMB_STATUSES.map((s) => (
                  <Chip
                    key={s}
                    label={t(STATUS_LABELS[s], { n: counts?.[s] ?? 0 })}
                    uppercase={false}
                    active={draft.outcome === s}
                    onPress={() => set({ outcome: s })}
                  />
                ))}
              </Chips>
            </Field>
            <Field title={t("climbs.where")}>
              <View style={{ gap: 8 }}>
                <Chips>
                  {(["indoor", "outdoor"] as const).map((s) => (
                    <Chip
                      key={s}
                      label={t(s === "indoor" ? "common.indoor" : "common.outdoor")}
                      active={draft.setting === s}
                      onPress={() => set({ setting: draft.setting === s ? null : s })}
                    />
                  ))}
                </Chips>
                <Picker
                  title={t("climbs.where")}
                  any={t("sessions.anyPlace")}
                  value={draft.place}
                  options={choices.places}
                  onPick={(place) => set({ place })}
                />
              </View>
            </Field>
          </>
        )}

        {training && (
          <>
            <GroupHeading title={t("statistics.training")} kind="strength" />
            <Field title={t("workouts.category")}>
              <Chips>
                {CATEGORIES.map((kind) => (
                  <Chip
                    key={kind}
                    label={kindLabel(kind)}
                    leading={<DayMark kind={kind} filled />}
                    active={draft.categories.includes(kind)}
                    onPress={() => set({ categories: toggled(draft.categories, kind) })}
                  />
                ))}
              </Chips>
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
          <Chips>
            {FOCI.map((focus) => (
              <Chip
                key={focus}
                label={focusLabel(focus)}
                active={draft.foci.includes(focus)}
                onPress={() => set({ foci: toggled(draft.foci, focus) })}
              />
            ))}
          </Chips>
        </Field>
      </View>
    </Sheet>
  );
}

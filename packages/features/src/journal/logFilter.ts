import type { ClimbSummary, SessionRow, SessionWithClimbs } from "@sendtally/api-client";
import type { WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "../activities/format";
import { t } from "../i18n";
import {
  climbLog,
  climbingSessionVM,
  gradeFilterLabel,
  matchesClimbSearch,
  type ClimbLogVM,
  type ClimbingSessionVM,
} from "../climbs/log";
import { climbOf } from "../climbs/overview";
import { disciplineLabel } from "../log-session/types";
import { disciplineOf } from "../log-session/transforms";
import { hangGripLabel, hangTitle } from "../sessions/hang";
import { sessionTitle } from "../sessions/title";
import { focusLabel } from "../training/focus";
import { bucketsFor } from "../trends/buckets";
import { isYearRange, trendRangeLabel } from "../trends/types";
import { exerciseKey } from "../statistics/exercises";
import { entryTitle, groupTrips, logItemWorkout } from "./transforms";
import { logCountLabel } from "../sessions/years";
import type { LogContext, LogFilter, LogItem, LogPill, LogRowType, LogView } from "./types";

export const NO_LOG_FILTER: LogFilter = {
  show: [],
  when: "all",
  effort: null,
  tags: [],
  discipline: null,
  grade: null,
  outcome: "all",
  setting: null,
  place: null,
  categories: [],
  exercise: null,
  block: null,
  workout: null,
  foci: [],
  search: "",
};

const CLIMBING_KEYS = ["discipline", "grade", "outcome", "setting", "place"] as const;
const TRAINING_KEYS = ["categories", "exercise"] as const;

const narrows = (filter: LogFilter, keys: readonly (keyof LogFilter)[]): boolean =>
  keys.some((k) => {
    const v = filter[k];
    return Array.isArray(v) ? v.length > 0 : v !== null && v !== "all" && v !== "";
  });

const cleared = (filter: LogFilter, keys: readonly (keyof LogFilter)[]): LogFilter =>
  Object.fromEntries(
    Object.entries(filter).map(([k, v]) => [
      k,
      keys.includes(k as keyof LogFilter) ? NO_LOG_FILTER[k as keyof LogFilter] : v,
    ])
  ) as LogFilter;

const groupKeys = (type: LogRowType): readonly (keyof LogFilter)[] =>
  type === "climbing" ? CLIMBING_KEYS : type === "training" ? TRAINING_KEYS : [];

const isFlatLog = (filter: LogFilter): boolean => filter.grade !== null || filter.outcome !== "all";

export const logFilterActive = (filter: LogFilter): boolean =>
  narrows(filter, Object.keys(NO_LOG_FILTER) as (keyof LogFilter)[]);

export const showsType = (filter: LogFilter, type: LogRowType): boolean =>
  filter.show.length === 0 || filter.show.includes(type);

/**
 * The next filter: a new Show clears the groups it leaves out, and setting a Climbing or
 * Training filter lights that type in Show.
 */
export function updateLogFilter(filter: LogFilter, patch: Partial<LogFilter>): LogFilter {
  const next = { ...filter, ...patch };
  if (patch.show !== undefined) {
    const out = [
      ...(showsType(next, "climbing") ? [] : CLIMBING_KEYS),
      ...(showsType(next, "training") ? [] : TRAINING_KEYS),
    ];
    return cleared(next, out);
  }
  const lit = (["climbing", "training"] as const).filter(
    (type) =>
      narrows(next, type === "climbing" ? CLIMBING_KEYS : TRAINING_KEYS) &&
      !next.show.includes(type)
  );
  return lit.length === 0 ? next : { ...next, show: [...next.show, ...lit] };
}

function rowTypeOf(item: LogItem): LogRowType {
  if (item.type === "session") return "climbing";
  if (item.type === "entry") return item.entry.kind;
  return "training";
}

function effortOf(item: LogItem): number | null {
  if (item.type === "session") return item.session.rpe_source === "none" ? null : item.session.rpe;
  if (item.type === "hang") return item.hang.rpe;
  if (item.type === "activity") return item.activity.rpe;
  return null;
}

type PlanLinked = { membershipId: string | null; focus: LogFilter["foci"][number] | null };

function planLinkOf(item: LogItem): PlanLinked | null {
  if (item.type === "session")
    return { membershipId: item.session.membership_id, focus: item.session.focus };
  if (item.type === "hang")
    return { membershipId: item.hang.membershipId, focus: item.hang.focus ?? null };
  if (item.type === "activity")
    return { membershipId: item.activity.membershipId, focus: item.activity.focus ?? null };
  return null;
}

const membershipOf = (ctx: LogContext, item: LogItem) => {
  const id = planLinkOf(item)?.membershipId ?? null;
  return id === null ? undefined : ctx.memberships.find((m) => m.id === id);
};

function blockOf(item: LogItem, ctx: LogContext): string | null {
  if (item.type === "block") return item.recap.block.id;
  return membershipOf(ctx, item)?.blockId ?? null;
}

function workoutOf(item: LogItem, ctx: LogContext): string | null {
  if (item.type === "session") return membershipOf(ctx, item)?.workoutId ?? null;
  return logItemWorkout(item)?.key ?? null;
}

function categoryOf(item: LogItem): WorkoutKind | null {
  if (item.type === "hang") return "hangboard";
  return item.type === "activity" ? item.activity.kind : null;
}

function exercisesOf(item: LogItem, ctx: LogContext): string[] {
  if (item.type === "hang") {
    return [hangGripLabel(item.hang), ...item.hang.done.map((d) => d.exercise)].filter(
      (name): name is string => name !== null
    );
  }
  if (item.type !== "activity") return [];
  const grips = ctx.hangParts
    .filter((p) => p.activityId === item.activity.id)
    .map((p) => hangGripLabel(p));
  return [...item.activity.done.map((d) => d.exercise), ...grips].filter(
    (name): name is string => name !== null && name.trim() !== ""
  );
}

function placeOf(session: SessionRow): string | null {
  return session.gym_id ?? session.area_id;
}

function inWhen(item: LogItem, filter: LogFilter, now: Date): boolean {
  if (filter.when === "all") return true;
  const buckets = bucketsFor(filter.when, now, null);
  const at = Date.parse(item.at);
  const end = isYearRange(filter.when) ? (buckets.at(-1)?.end ?? Infinity) : Infinity;
  return at >= (buckets[0]?.start ?? 0) && at < end;
}

function passesShared(item: LogItem, filter: LogFilter, ctx: LogContext, now: Date): boolean {
  if (!showsType(filter, rowTypeOf(item))) return false;
  if (!inWhen(item, filter, now)) return false;
  if (filter.effort !== null) {
    const e = effortOf(item);
    if (e === null || e < filter.effort.lo || e > filter.effort.hi) return false;
  }
  if (filter.tags.length > 0 && !item.tags.some((tag) => filter.tags.includes(tag.slug)))
    return false;
  if (filter.block !== null && blockOf(item, ctx) !== filter.block) return false;
  if (filter.workout !== null && workoutOf(item, ctx) !== filter.workout) return false;
  if (filter.foci.length > 0) {
    const focus = planLinkOf(item)?.focus ?? null;
    if (focus === null || !filter.foci.includes(focus)) return false;
  }
  return true;
}

function passesTraining(item: LogItem, filter: LogFilter, ctx: LogContext): boolean {
  if (rowTypeOf(item) !== "training") return true;
  if (filter.categories.length > 0) {
    const kind = categoryOf(item);
    if (kind === null || !filter.categories.includes(kind)) return false;
  }
  if (filter.exercise === null) return true;
  return exercisesOf(item, ctx).some((name) => exerciseKey(name) === filter.exercise);
}

function passesWhere(session: SessionRow, filter: LogFilter): boolean {
  if (filter.setting !== null && session.location !== filter.setting) return false;
  return filter.place === null || placeOf(session) === filter.place;
}

const includes = (text: string | null | undefined, q: string): boolean =>
  (text ?? "").toLowerCase().includes(q);

function ownText(item: LogItem, ctx: LogContext): string[] {
  const base = [item.blockTag ?? null, ...item.tags.map((tag) => tag.name)];
  if (item.type === "session") {
    const place = placeOf(item.session);
    return [
      ...base,
      sessionTitle(item.session),
      item.session.title,
      place === null ? null : (ctx.places.get(place) ?? null),
    ].filter((s): s is string => s !== null);
  }
  if (item.type === "hang")
    return [...base, hangTitle(item.hang), ...exercisesOf(item, ctx)].filter(
      (s): s is string => s !== null
    );
  if (item.type === "activity")
    return [...base, item.activity.title, ...exercisesOf(item, ctx)].filter(
      (s): s is string => s !== null
    );
  if (item.type === "block") return [item.recap.block.name];
  return [...base, entryTitle(item.entry)].filter((s): s is string => s !== null);
}

const sessionClimbs = (
  session: SessionWithClimbs | undefined,
  climbs: readonly ClimbSummary[]
): ClimbSummary[] =>
  session === undefined
    ? []
    : [...new Set(session.climbs.flatMap((l) => climbOf(climbs, l) ?? []))];

type Matched = { item: LogItem; climbing?: ClimbingSessionVM };

function matchItem(
  item: LogItem,
  filter: LogFilter,
  ctx: LogContext,
  withClimbs: ReadonlyMap<string, SessionWithClimbs>,
  now: Date
): Matched | null {
  if (!passesShared(item, filter, ctx, now) || !passesTraining(item, filter, ctx)) return null;
  const q = filter.search.trim().toLowerCase();
  const found = q === "" || ownText(item, ctx).some((s) => includes(s, q));
  if (item.type !== "session") return found ? { item } : null;
  if (!passesWhere(item.session, filter)) return null;
  const full = withClimbs.get(item.session.fingerprint);
  const vm = full === undefined ? undefined : climbingSessionVM(full, ctx.climbs, ctx.scales);
  const logged = full?.climbs ?? [];
  if (
    filter.discipline !== null &&
    !logged.some((l) => l.grade != null && disciplineOf(l.grade.scale) === filter.discipline)
  )
    return null;
  const kept = sessionClimbs(full, ctx.climbs).filter(
    (c) =>
      (filter.discipline === null || c.discipline === filter.discipline) &&
      (found || matchesClimbSearch(c, q, ctx.scales))
  );
  if (!found && kept.length === 0) return null;
  const narrowed = filter.discipline !== null || !found;
  if (vm === undefined) return { item };
  if (!narrowed) return { item, climbing: vm };
  const ids = new Set(kept.map((c) => c.id));
  return { item, climbing: { ...vm, climbs: vm.climbs.filter((row) => ids.has(row.id)) } };
}

/**
 * The Log as drawn under a filter. A trip holds the rows inside its dates that pass, and
 * shows when any does; with Trips left out of Show its rows stand on their own.
 */
export function filterLog(
  items: readonly LogItem[],
  filter: LogFilter,
  ctx: LogContext,
  now: Date = new Date()
): LogView {
  const withClimbs = new Map(ctx.sessions.map((s) => [s.fingerprint, s]));
  if (isFlatLog(filter))
    return { kind: "climbs", log: flatClimbs(items, filter, ctx, withClimbs, now) };
  const climbing = new Map<string, ClimbingSessionVM>();
  const keep = (item: LogItem): LogItem[] => {
    const m = matchItem(item, filter, ctx, withClimbs, now);
    if (m === null) return [];
    if (m.climbing !== undefined && item.type === "session")
      climbing.set(item.session.fingerprint, m.climbing);
    return [item];
  };
  const tripsOnly = filter.show.length === 1 && filter.show[0] === "trip";
  const shown = groupTrips([...items], now).flatMap((item): LogItem[] => {
    if (item.type !== "entry" || item.entry.kind !== "trip") return keep(item);
    if (tripsOnly) {
      if (keep(item).length === 0) return [];
      item.inside.forEach(keepAll);
      return [item];
    }
    const inside = item.inside.flatMap(keep);
    if (!showsType(filter, "trip")) return inside;
    const own =
      matchItem(item, filter, ctx, withClimbs, now) !== null &&
      (!logFilterActive(filter) ||
        filter.show.includes("trip") ||
        filter.search.trim() !== "" ||
        filter.tags.length > 0);
    if (own) return [{ ...item, inside }];
    return inside.length > 0 ? [{ ...item, inside, frame: true }] : [];
  });
  function keepAll(item: LogItem): void {
    if (item.type !== "session") return;
    const full = withClimbs.get(item.session.fingerprint);
    if (full !== undefined)
      climbing.set(item.session.fingerprint, climbingSessionVM(full, ctx.climbs, ctx.scales));
  }
  return { kind: "dated", items: shown, climbing };
}

function flatClimbs(
  items: readonly LogItem[],
  filter: LogFilter,
  ctx: LogContext,
  withClimbs: ReadonlyMap<string, SessionWithClimbs>,
  now: Date
) {
  const sessionFilter: LogFilter = {
    ...NO_LOG_FILTER,
    when: filter.when,
    effort: filter.effort,
    tags: filter.tags,
    block: filter.block,
    workout: filter.workout,
    foci: filter.foci,
    setting: filter.setting,
    place: filter.place,
  };
  const scoped = logFilterActive(sessionFilter);
  const allowed = scoped
    ? new Set(
        items
          .filter(
            (i) =>
              i.type === "session" &&
              passesShared(i, sessionFilter, ctx, now) &&
              passesWhere(i.session, sessionFilter)
          )
          .flatMap((i) =>
            i.type === "session"
              ? sessionClimbs(withClimbs.get(i.session.fingerprint), ctx.climbs)
              : []
          )
      )
    : null;
  const climbs = ctx.climbs.filter(
    (c) =>
      (allowed === null || allowed.has(c)) &&
      (filter.discipline === null || c.discipline === filter.discipline)
  );
  return climbLog(
    climbs,
    ctx.sessions,
    {
      query: filter.search,
      grade: filter.grade,
      status: filter.outcome,
      scales: ctx.scales,
    },
    now
  );
}

const SHOW_LABELS: Record<LogRowType, () => string> = {
  climbing: () => t("statistics.climbing"),
  training: () => t("statistics.training"),
  journal: () => t("journal.showJournal"),
  trip: () => t("journal.showTrips"),
  injury: () => t("journal.showInjuries"),
};

export const logRowTypeLabel = (type: LogRowType): string => SHOW_LABELS[type]();

const effortLabel = ({ lo, hi }: { lo: number; hi: number }): string =>
  lo === hi ? `RPE ${lo}` : `RPE ${lo}-${hi}`;

export type LogNames = {
  tag: (slug: string) => string;
  place: (id: string) => string;
  block: (id: string) => string;
  workout: (key: string) => string;
  exercise: (key: string) => string;
};

/** Each active filter as a pill under the bar, in the sheet's order. Search is the bar's own. */
export function logFilterPills(filter: LogFilter, names: LogNames): LogPill[] {
  const pill = (key: string, label: string, patch: Partial<LogFilter>): LogPill => ({
    key,
    label,
    without: { ...filter, ...patch },
  });
  const without = <T>(list: readonly T[], value: T): T[] => list.filter((v) => v !== value);
  return [
    ...filter.show.map((type) => ({
      key: `show:${type}`,
      label: logRowTypeLabel(type),
      without: updateLogFilter(cleared(filter, groupKeys(type)), {
        show: without(filter.show, type),
      }),
    })),
    ...(filter.when === "all" ? [] : [pill("when", trendRangeLabel(filter.when), { when: "all" })]),
    ...(filter.effort === null
      ? []
      : [pill("effort", effortLabel(filter.effort), { effort: null })]),
    ...filter.tags.map((slug) =>
      pill(`tag:${slug}`, names.tag(slug), { tags: without(filter.tags, slug) })
    ),
    ...(filter.discipline === null || filter.grade !== null
      ? []
      : [pill("discipline", disciplineLabel(filter.discipline), { discipline: null })]),
    ...(filter.grade === null
      ? []
      : [pill("grade", gradeFilterLabel(filter.grade), { grade: null })]),
    ...(filter.outcome === "all"
      ? []
      : [pill("outcome", outcomeLabel(filter.outcome), { outcome: "all" })]),
    ...(filter.setting === null
      ? []
      : [
          pill("setting", t(filter.setting === "indoor" ? "common.indoor" : "common.outdoor"), {
            setting: null,
          }),
        ]),
    ...(filter.place === null ? [] : [pill("place", names.place(filter.place), { place: null })]),
    ...filter.categories.map((kind) =>
      pill(`category:${kind}`, kindLabel(kind), { categories: without(filter.categories, kind) })
    ),
    ...(filter.exercise === null
      ? []
      : [pill("exercise", names.exercise(filter.exercise), { exercise: null })]),
    ...(filter.block === null ? [] : [pill("block", names.block(filter.block), { block: null })]),
    ...(filter.workout === null
      ? []
      : [pill("workout", names.workout(filter.workout), { workout: null })]),
    ...filter.foci.map((focus) =>
      pill(`focus:${focus}`, focusLabel(focus), { foci: without(filter.foci, focus) })
    ),
  ];
}

const OUTCOME_KEYS = {
  projects: "common.projects",
  sent: "common.sent",
  notYet: "sessionDetail.notYet",
} as const;

const outcomeLabel = (outcome: Exclude<LogFilter["outcome"], "all">): string =>
  t(OUTCOME_KEYS[outcome]);

export type LogOption = { key: string; name: string };

const distinct = (options: LogOption[]): LogOption[] =>
  [...new Map(options.map((o) => [o.key, o])).values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

export function logExerciseOptions(items: readonly LogItem[], ctx: LogContext): LogOption[] {
  return distinct(
    items.flatMap((item) =>
      exercisesOf(item, ctx).map((name) => ({ key: exerciseKey(name), name: name.trim() }))
    )
  );
}

export function logWorkoutOptions(
  items: readonly LogItem[],
  ctx: LogContext,
  name: (key: string) => string | null
): LogOption[] {
  return distinct(
    items.flatMap((item) => {
      const key = workoutOf(item, ctx);
      if (key === null) return [];
      const named = logItemWorkout(item)?.name ?? name(key);
      return named === null ? [] : [{ key, name: named }];
    })
  );
}

export function logPlaceOptions(items: readonly LogItem[], ctx: LogContext): LogOption[] {
  return distinct(
    items.flatMap((item) => {
      if (item.type !== "session") return [];
      const key = placeOf(item.session);
      const name = key === null ? undefined : ctx.places.get(key);
      return key === null || name === undefined ? [] : [{ key, name }];
    })
  );
}

export function logOutcomeCounts(
  items: readonly LogItem[],
  filter: LogFilter,
  ctx: LogContext,
  now: Date = new Date()
): ClimbLogVM["counts"] {
  const withClimbs = new Map(ctx.sessions.map((s) => [s.fingerprint, s]));
  return flatClimbs(items, { ...filter, outcome: "all" }, ctx, withClimbs, now).counts;
}

export function logViewCountLabel(view: LogView): string {
  if (view.kind === "dated") return logCountLabel(view.items);
  const count = view.log.groups.reduce((n, g) => n + g.rows.length, 0);
  return t("common.climbCount", { count });
}

const STATUS_LABELS = {
  all: "climbs.statusAll",
  projects: "climbs.statusProjects",
  sent: "climbs.statusSent",
  notYet: "climbs.statusNotYet",
} as const;

export const outcomeChipLabel = (outcome: LogFilter["outcome"], n: number): string =>
  t(STATUS_LABELS[outcome], { n });

export const LOG_CATEGORIES: readonly WorkoutKind[] = [
  "climbing",
  "hangboard",
  "strength",
  "mobility",
  "other",
];

export const LOG_DISCIPLINES: readonly NonNullable<LogFilter["discipline"]>[] = [
  "boulder",
  "route",
];

import type { PlanItem } from "@sendtally/api-client";
import {
  addDays,
  endChoiceOf,
  endOf,
  minDate,
  occursOn,
  type CalendarDate,
  type Weekday,
} from "@sendtally/core/hang";
import { detailFromTemplate, templateOf } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { DEFAULT_WEEKS, endChoice } from "../planner/scheduleDraft";
import { defaultTitle, planItemWhen } from "./planItemText";
import type { PlanItemDraft, PlanItemRequest } from "./types";

const DEFAULT_PER_WEEK = 3;

export function planItemDraft(request: PlanItemRequest, today: CalendarDate): PlanItemDraft {
  if (request.mode === "new") {
    return {
      kind: request.kind,
      title: defaultTitle(request.kind),
      mode: "days",
      days: request.days,
      perWeek: DEFAULT_PER_WEEK,
      start: request.start,
      minStart: today,
      endMode: "never",
      weeks: DEFAULT_WEEKS,
      last: addDays(request.start, DEFAULT_WEEKS * 7 - 1),
      minutes: null,
      targetRpe: null,
      projectId: null,
      template: null,
    };
  }
  const { item } = request;
  const end = endChoiceOf(item);
  return {
    kind: item.kind,
    title: item.title,
    mode: item.perWeek === null ? "days" : "perWeek",
    days: item.days,
    perWeek: item.perWeek ?? DEFAULT_PER_WEEK,
    start: item.start,
    minStart: minDate(item.start, today),
    endMode: end.mode,
    weeks: end.mode === "weeks" ? end.weeks : DEFAULT_WEEKS,
    last: end.mode === "date" ? end.last : addDays(item.start, DEFAULT_WEEKS * 7 - 1),
    minutes: item.minutes,
    targetRpe: item.targetRpe,
    projectId: item.projectId,
    template: detailFromTemplate(item.template),
  };
}

/** The plan item a draft saves as, or null while it is not one yet. */
export function planItemOf(
  draft: PlanItemDraft,
  id: string,
  skip: readonly CalendarDate[]
): PlanItem | null {
  const title = draft.title.trim();
  const days = draft.mode === "days" ? draft.days : [];
  const end = endOf(draft.start, endChoice(draft));
  if (title === "" || (draft.mode === "days" && days.length === 0)) return null;
  if (end !== null && end <= draft.start) return null;
  return {
    id,
    kind: draft.kind,
    title,
    days,
    perWeek: draft.mode === "perWeek" ? draft.perWeek : null,
    start: draft.start,
    end,
    skip: [...skip],
    minutes: draft.minutes,
    targetRpe: draft.targetRpe,
    projectId: draft.kind === "climb" ? draft.projectId : null,
    template: draft.kind === "climb" ? null : templateOf(draft.template),
  };
}

/** The form's one-line summary: what is still missing, else when it lands. */
export function planItemSummary(draft: PlanItemDraft): string {
  if (draft.title.trim() === "") return t("plan.summaryName");
  if (draft.mode === "days" && draft.days.length === 0) return t("hang.summaryPickDay");
  const item = planItemOf(draft, "", []);
  return item === null ? t("hang.summaryNoDates") : planItemWhen(item);
}

/** Whether a date falls inside the draft's plan, for the calendars to shade. */
export function planItemShades(draft: PlanItemDraft, d: CalendarDate): boolean {
  const end = endOf(draft.start, endChoice(draft));
  const days: Weekday[] = draft.mode === "days" ? draft.days : [0, 1, 2, 3, 4, 5, 6];
  return occursOn({ start: draft.start, end, days, skip: [] }, d);
}

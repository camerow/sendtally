import React from "react";
import { randomUUID } from "expo-crypto";
import type { TrainingBlock } from "@sendtally/api-client";
import type { CalendarDate, Weekday } from "@sendtally/core/hang";
import { useBlocks } from "../blocks/useBlocks";
import { useHangData } from "../data/HangDataContext";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";
import { planItemDraft, planItemOf, planItemShades, planItemSummary } from "./planItemDraft";
import type { PlanItemDraft, PlanItemRequest } from "./types";
import { usePlanActions } from "./usePlanActions";

export type PlanItemForm = {
  isEdit: boolean;
  draft: PlanItemDraft;
  block: TrainingBlock | undefined;
  summary: string;
  ready: boolean;
  shaded: (d: CalendarDate) => boolean;
  update: (patch: Partial<PlanItemDraft>) => void;
  toggleDay: (day: Weekday) => void;
  save: () => void;
  remove: () => void;
};

/** The plan item sheet's state, and what saving or removing it writes. */
export function usePlanItemForm(request: PlanItemRequest, onDone: () => void): PlanItemForm {
  const { today } = useHangData();
  const actions = usePlanActions();
  const prompt = useReminderPrompt();
  const [draft, setDraft] = React.useState(() => planItemDraft(request, today));
  const existing = request.mode === "edit" ? request.item : null;
  const block = useBlocks().find((b) => b.id === draft.blockId);
  const item = planItemOf(draft, existing?.id ?? "", existing?.skip ?? [], block);
  const update = (patch: Partial<PlanItemDraft>): void => setDraft((d) => ({ ...d, ...patch }));

  return {
    isEdit: existing !== null,
    draft,
    block,
    summary: planItemSummary(draft, block),
    ready: item !== null,
    shaded: (d) => planItemShades(draft, d),
    update,
    toggleDay: (day) =>
      update({
        days: draft.days.includes(day)
          ? draft.days.filter((d) => d !== day)
          : [...draft.days, day].sort(),
      }),
    save: () => {
      if (item === null) return;
      void actions.savePlanItem(existing === null ? { ...item, id: randomUUID() } : item);
      onDone();
      if (existing === null) prompt();
    },
    remove: () => {
      if (existing !== null) void actions.deletePlanItem(existing.id);
      onDone();
    },
  };
}

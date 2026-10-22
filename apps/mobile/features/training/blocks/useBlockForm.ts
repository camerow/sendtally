import { randomUUID } from "expo-crypto";
import React from "react";
import { Alert } from "react-native";
import type { TrainingBlock } from "@sendtally/api-client";
import { addDays, type CalendarDate } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import { blockDraft, blockOf, blockSummary, withWeeks } from "./blockDraft";
import type { BlockDraft } from "./types";

export type BlockForm = {
  isEdit: boolean;
  draft: BlockDraft;
  summary: string;
  ready: boolean;
  /** Running now, so it can end today rather than only be deleted. */
  canEnd: boolean;
  shaded: (d: CalendarDate) => boolean;
  update: (patch: Partial<BlockDraft>) => void;
  setWeeks: (weeks: number) => void;
  save: () => void;
  end: () => void;
  remove: () => void;
};

/**
 * The block sheet's state. Saving a new block hands it to `onDone` so its plans can be
 * added next; ending one ends its plans today, deleting one leaves them planned on their own.
 */
export function useBlockForm(
  block: TrainingBlock | null,
  onDone: (created: TrainingBlock | null) => void
): BlockForm {
  const { today } = useHangData();
  const actions = usePlanActions();
  const [draft, setDraft] = React.useState(() => blockDraft(block, today));
  const saved = blockOf(draft, block?.id ?? "", block?.endedOn ?? null);
  const update = (patch: Partial<BlockDraft>): void => setDraft((d) => ({ ...d, ...patch }));
  const confirm = (title: string, body: string, action: string, run: () => void): void =>
    Alert.alert(title, body, [
      { text: t("hang.cancel"), style: "cancel" },
      { text: action, style: "destructive", onPress: run },
    ]);

  return {
    isEdit: block !== null,
    draft,
    summary: blockSummary(draft),
    ready: saved !== null,
    canEnd: block !== null && block.start <= today,
    shaded: (d) => d >= draft.start && d < addDays(draft.start, draft.weeks * 7),
    update,
    setWeeks: (weeks) => {
      const patch = withWeeks(draft, weeks);
      if (patch !== null) update(patch);
    },
    save: () => {
      if (saved === null) return;
      const next = block === null ? { ...saved, id: randomUUID() } : saved;
      void actions.saveBlock(next);
      onDone(block === null ? next : null);
    },
    end: () => {
      if (block === null) return;
      confirm(
        t("plan.endBlockTitle", { name: block.name }),
        t("plan.endBlockBody"),
        t("plan.endBlock"),
        () => {
          void actions.saveBlock({ ...block, endedOn: addDays(today, 1) });
          onDone(null);
        }
      );
    },
    remove: () => {
      if (block === null) return onDone(null);
      confirm(
        t("plan.deleteBlockTitle", { name: block.name }),
        t("plan.deleteBlockBody"),
        t("plan.deleteBlock"),
        () => {
          void actions.deleteBlock(block.id);
          onDone(null);
        }
      );
    },
  };
}

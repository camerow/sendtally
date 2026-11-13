import React from "react";
import { useNavigate } from "react-router";
import { blockEnded, isDated } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockDateRange,
  blockMembership,
  nextPosition,
  useTrainingLog,
} from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../data/usePlanActions";
import { blockPath } from "./paths";

export type AddToBlock = { item: MoreMenuItem | null; sheet: React.ReactNode };

/**
 * A workout's Add to block: any template or block not over yet, with no days to start. One
 * press adds it and closes; a toast says where it went, with View.
 */
export function useAddToBlock(workout: LibraryWorkout): AddToBlock {
  const { today } = useHangData();
  const { plan } = useTrainingLog(useAppApi()).log;
  const actions = usePlanActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const blocks = plan.blocks.filter((b) => !blockEnded(b, today));
  const title = t("plan.addToBlockMenu");
  return {
    item: blocks.length === 0 ? null : { label: title, onSelect: () => setOpen(true) },
    sheet: (
      <Sheet open={open} kicker={workout.name} title={title} onClose={() => setOpen(false)}>
        <div className="option-list">
          {blocks.map((b) => {
            const name = b.name || t("plan.untitled");
            const there = plan.memberships.some(
              (m) => m.blockId === b.id && m.workoutId === workout.id
            );
            return (
              <button
                key={b.id}
                type="button"
                className="option-row option-row--detail"
                aria-pressed={there}
                disabled={there}
                onClick={() => {
                  setOpen(false);
                  void actions.saveMembership(
                    blockMembership(
                      crypto.randomUUID(),
                      workout.id,
                      b,
                      today,
                      nextPosition(plan, b.id)
                    )
                  );
                  toast.show({
                    message: t("common.addedTo", { name }),
                    action: {
                      label: t("common.view"),
                      onPress: () => void navigate(blockPath(b.id)),
                    },
                  });
                }}
              >
                <span className="option-row-text">
                  <span>{name}</span>
                  <span className="option-row-detail">
                    {isDated(b) ? blockDateRange(b) : t("plan.template")}
                  </span>
                </span>
                {there && <Icon name="check" size={18} strokeWidth={2.4} />}
              </button>
            );
          })}
        </div>
      </Sheet>
    ),
  };
}

import React from "react";
import { useNavigate } from "react-router";
import { isDated } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockDateRange,
  blockMembership,
  nextPosition,
  useTrainingLog,
  blockName,
  addToBlockOptions,
} from "@sendtally/features/training";
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
 * Add to block for a workout, or for what becomes one once picked: any template or block not
 * over yet, with no days to start. `workoutId` is the workout when there is one already;
 * without, `resolve` makes it on a pick. One
 * press adds it and closes; a toast says where it went, with View.
 */
export function useAddToBlock(
  name: string,
  workoutId: string | undefined,
  resolve?: () => Promise<string | null>
): AddToBlock {
  const { today } = useHangData();
  const { plan } = useTrainingLog(useAppApi()).log;
  const actions = usePlanActions();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const options = addToBlockOptions(plan, workoutId ?? "", today);
  const title = t("plan.addToBlockMenu");
  return {
    item: options.length === 0 ? null : { label: title, onSelect: () => setOpen(true) },
    sheet: (
      <Sheet open={open} kicker={name} title={title} onClose={() => setOpen(false)}>
        <div className="option-list">
          {options.map(({ block: b, there }) => {
            const where = blockName(b);
            return (
              <button
                key={b.id}
                type="button"
                className="option-row option-row--detail"
                aria-pressed={there}
                disabled={there}
                onClick={() => {
                  setOpen(false);
                  const save = (id: string | null): void => {
                    if (id === null) return;
                    void actions.saveMembership(
                      blockMembership(crypto.randomUUID(), id, b, today, nextPosition(plan, b.id))
                    );
                  };
                  if (workoutId !== undefined) save(workoutId);
                  else void resolve?.().then(save);
                  toast.show({
                    message: t("common.addedTo", { name: where }),
                    action: {
                      label: t("common.view"),
                      onPress: () => void navigate(blockPath(b.id)),
                    },
                  });
                }}
              >
                <span className="option-row-text">
                  <span>{where}</span>
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

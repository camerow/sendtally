import React from "react";
import type { Membership, WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockOfMembership,
  daysThisWeek,
  plannedIn,
  usePlan,
  usePlanActions,
} from "@sendtally/features/training";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { useAppApi } from "../../lib/useAppApi";
import { MiniWeek } from "../components/MiniWeek";
import { useHangData } from "../data/HangDataContext";

export type PlanListProps = { workoutId: string; name: string; kind: WorkoutKind };

/** Where a workout is planned, by start date: × takes it out. Left out when it is planned nowhere. */
export function PlanList({ workoutId, name, kind }: PlanListProps): React.ReactElement | null {
  const api = useAppApi();
  const toast = useToast();
  const { today } = useHangData();
  const { state } = usePlan(api);
  const failed = React.useCallback(() => toast.show({ message: t("hang.saveFailed") }), [toast]);
  const actions = usePlanActions(api, failed);
  const [removing, setRemoving] = React.useState<{ m: Membership; where: string } | null>(null);
  const plan = state.status === "ready" ? state.data : null;
  const members = plan?.memberships.filter((m) => m.workoutId === workoutId) ?? [];
  if (plan === null || members.length === 0) return null;
  return (
    <section className="detail-section">
      <SectionHeading title={t("plan.plannedIn")} />
      {members.map((m) => {
        const block = blockOfMembership(plan, m);
        const { name: where, meta } = plannedIn(m, block, today);
        return (
          <div key={m.id} className="plan-row">
            <span className="plan-row-text">
              <span className="plan-row-name">{where}</span>
              {meta !== "" && <span className="plan-row-meta">{meta}</span>}
            </span>
            <MiniWeek kind={kind} m={{ ...m, weekdays: daysThisWeek(plan, m, block, today) }} />
            <button
              type="button"
              className="plan-row-remove"
              aria-label={t("plan.remove", { title: name })}
              onClick={() => setRemoving({ m, where })}
            >
              <Icon name="x" size={18} strokeWidth={2} />
            </button>
          </div>
        );
      })}
      <Sheet
        open={removing !== null}
        title={
          removing === null ? "" : t("plan.removeFromTitle", { title: name, block: removing.where })
        }
        onClose={() => setRemoving(null)}
        action={{
          label: t("plan.removeAction"),
          danger: true,
          onPress: () => {
            if (removing !== null) void actions.deleteMembership(removing.m.id);
            setRemoving(null);
          },
        }}
      >
        <p className="sheet-body">{t("plan.removeHistoryKept")}</p>
      </Sheet>
    </section>
  );
}

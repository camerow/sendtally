import React from "react";
import { useNavigate } from "react-router";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockGroups,
  blockMembers,
  daysThisWeek,
  ongoingMembers,
  pastMeta,
  planGridRows,
  templateMeta,
  usePlan,
  useTrainingLog,
} from "@sendtally/features/training";
import { workoutPath } from "../library/useLibrary";
import { useAppApi } from "../../lib/useAppApi";
import { DashedPanel } from "../components/DashedPanel";
import { PlanGrid } from "../components/PlanGrid";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { BlockCard } from "./BlockCard";
import { BlockRow } from "./BlockRow";
import { PlanCard } from "./PlanCard";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="blocks-section">
      <h2 className="train-title shelf-title blocks-section-title">{title}</h2>
      <div className="blocks-section-body">{children}</div>
    </section>
  );
}

/** Train › Blocks: what is active (running blocks, then plans in no block), then upcoming blocks, templates and completed ones. */
export function BlocksList(): React.ReactElement {
  const { today, model } = useHangData();
  const api = useAppApi();
  const loaded = usePlan(api);
  const { log } = useTrainingLog(api);
  const navigate = useNavigate();
  const { plan, workout } = log;
  const { current, upcoming, templates, past } = blockGroups(plan.blocks, today);
  // Ongoing's own page arrives with #286; until then its card does not open.
  const ongoing = planGridRows(ongoingMembers(plan, today), workout, model, {
    open: (m) => void navigate(workoutPath(m.workoutId)),
  });
  const weeks = (n: number): string => t("calendar.weeks", { count: n });

  if (loaded.state.status !== "ready")
    return <LoadState state={loaded.state} onRetry={() => void loaded.reload()} />;
  if (plan.blocks.length === 0 && ongoing.length === 0)
    return <DashedPanel body={t("plan.empty")} />;
  return (
    <div className="blocks-list">
      {(current.length > 0 || ongoing.length > 0) && (
        <Section title={t("plan.active")}>
          {current.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              members={blockMembers(plan, block).map((m) => ({
                ...m,
                weekdays: daysThisWeek(plan, m, block, today),
              }))}
              workout={workout}
            />
          ))}
          {ongoing.length > 0 && (
            <PlanCard title={t("plan.ongoing")} subtitle={t("plan.ongoingRepeats")}>
              <PlanGrid rows={ongoing} framed={false} />
            </PlanCard>
          )}
        </Section>
      )}
      {upcoming.length > 0 && (
        <Section title={t("plan.upcoming")}>
          {upcoming.map((b) => (
            <BlockRow
              key={b.id}
              id={b.id}
              name={b.name}
              meta={`${t("plan.startsOn", { date: shortDate(b.start) })} · ${weeks(b.weeks)}`}
            />
          ))}
        </Section>
      )}
      {templates.length > 0 && (
        <Section title={t("plan.templates")}>
          {templates.map((b) => (
            <BlockRow
              key={b.id}
              id={b.id}
              name={b.name || t("plan.untitled")}
              meta={templateMeta(log, b)}
            />
          ))}
        </Section>
      )}
      {past.length > 0 && (
        <Section title={t("plan.completed")}>
          {past.map((b) => (
            <BlockRow key={b.id} id={b.id} name={b.name} meta={pastMeta(log, b, today)} />
          ))}
        </Section>
      )}
    </div>
  );
}

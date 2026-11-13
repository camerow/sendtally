import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockGroups,
  blockMembers,
  daysThisWeek,
  useTrainingLog,
  ongoingMembers,
  pastMeta,
  planGridRows,
  templateMeta,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { BlockCard } from "../blocks/BlockCard";
import { PlanCard } from "../blocks/PlanCard";
import { DashedPanel } from "../components/DashedPanel";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { openMembership } from "../plan/openMembership";
import { BlockRow } from "./BlockRow";

function Section({
  title,
  gap = 4,
  children,
}: {
  title: string;
  /** Between what is in it. */
  gap?: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ minHeight: 44, justifyContent: "center" }}>
        <Title size={26} color={colors.gunmetal}>
          {title}
        </Title>
      </View>
      <View style={{ gap }}>{children}</View>
    </View>
  );
}

/** Train > Blocks: what is active (running blocks, then plans in no block), then upcoming blocks, templates and completed ones. */
export function BlocksList(): React.ReactElement {
  const { today, model } = useHangData();
  const { log } = useTrainingLog(useApi());
  const { plan, workout } = log;
  const { current, upcoming, templates, past } = blockGroups(plan.blocks, today);
  const ongoing = planGridRows(ongoingMembers(plan, today), workout, model, {
    open: (m) => openMembership(m),
  });
  const weeks = (n: number): string => t("calendar.weeks", { count: n });
  const nothing = plan.blocks.length === 0 && ongoing.length === 0;

  return (
    <View style={{ gap: 28 }}>
      {nothing && <DashedPanel body={t("plan.empty")} />}
      {(current.length > 0 || ongoing.length > 0) && (
        <Section title={t("plan.active")} gap={12}>
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
            <PlanCard
              title={t("plan.ongoing")}
              subtitle={t("plan.ongoingRepeats")}
              open={{
                label: t("plan.openBlock", { name: t("plan.ongoing") }),
                onPress: () =>
                  router.push({ pathname: "/plan/ongoing", params: { back: t("training.train") } }),
              }}
            >
              <PlanGrid rows={ongoing} framed={false} />
            </PlanCard>
          )}
        </Section>
      )}
      {upcoming.length > 0 && (
        <Section title={t("plan.upcoming")}>
          {upcoming.map((b) => (
            <BlockRow
              back={t("training.train")}
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
              back={t("training.train")}
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
            <BlockRow
              back={t("training.train")}
              key={b.id}
              id={b.id}
              name={b.name}
              meta={pastMeta(log, b, today)}
            />
          ))}
        </Section>
      )}
    </View>
  );
}

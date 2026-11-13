import React from "react";
import { View } from "react-native";
import {
  IMPORT_SERVICES,
  type ImportPlan,
  type ImportSession,
  type LikelyDuplicate,
} from "@sendtally/core/import";
import { planStats } from "@sendtally/features/import";
import { formatDate, formatNumber, t } from "@sendtally/features/i18n";
import { monthName } from "@sendtally/features/sessions";
import { colors } from "@sendtally/design/tokens";
import { SectionHeading } from "../../components/SectionHeading";
import { SectionHeader } from "../sessions/SectionHeader";
import { SummaryTiles } from "../training/summary/SummaryTiles";
import { RowIssues } from "./RowIssues";
import { ImportHero } from "./ImportHero";
import { LikelyDuplicates } from "./LikelyDuplicates";
import { PlannedSessionRow } from "./PlannedSessionRow";

const dayLabel = (date: string): string =>
  formatDate(new Date(`${date}T00:00:00Z`), {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function rowMeta(session: ImportSession): string {
  const sends = session.climbs.filter((c) => c.kind === "send");
  const top = planStats([{ ...session, climbs: sends }]).topGrade;
  return [
    t("tally.sentCount", { count: sends.length }),
    ...(top === null ? [] : [t("sessions.topSend", { grade: top })]),
  ].join(" · ");
}

/**
 * What the file will add to the log: its numbers, the rows it skips, the
 * sessions that look like ones already there, then every other session newest first.
 */
export function ImportReview({
  fileName,
  plan,
  duplicates,
  importAnyway,
  onImportAnyway,
}: {
  fileName: string;
  plan: ImportPlan;
  duplicates: LikelyDuplicate[];
  importAnyway: boolean;
  onImportAnyway: (value: boolean) => void;
}): React.ReactElement {
  const flagged = new Set(duplicates.map((d) => d.index));
  const stats = planStats(
    importAnyway ? plan.sessions : plan.sessions.filter((_, i) => !flagged.has(i))
  );
  const first = plan.sessions[0]!;
  const last = plan.sessions[plan.sessions.length - 1]!;
  const newestFirst = plan.sessions.filter((_, i) => !flagged.has(i)).reverse();
  return (
    <>
      <View style={{ gap: 10 }}>
        <ImportHero
          kicker={
            plan.format === "sendtally"
              ? t("import.formatSendtally")
              : t("import.formatExport", { service: IMPORT_SERVICES[plan.format] })
          }
          kickerColor={colors.azureInk}
          title={t("import.reviewTitle")}
          meta={`${fileName} · ${dayLabel(first.date)} – ${dayLabel(last.date)}`}
        />
        <SummaryTiles
          stats={[
            { value: formatNumber(stats.sessions), label: t("import.statSessions") },
            { value: formatNumber(stats.climbs), label: t("import.statClimbs") },
            { value: stats.topGrade ?? "–", label: t("import.statTopGrade") },
          ]}
        />
      </View>
      {plan.issues.length > 0 && <RowIssues issues={plan.issues} />}
      {duplicates.length > 0 && (
        <LikelyDuplicates
          sessions={plan.sessions}
          duplicates={duplicates}
          importAnyway={importAnyway}
          onImportAnyway={onImportAnyway}
        />
      )}
      {newestFirst.length > 0 && (
        <View style={{ marginHorizontal: -18 }}>
          <View style={{ paddingHorizontal: 18 }}>
            <SectionHeading title={t("import.sessionsLabel")} />
          </View>
          {newestFirst.map((s, i) => (
            <React.Fragment key={i}>
              {s.date.slice(0, 7) !== newestFirst[i - 1]?.date.slice(0, 7) && (
                <SectionHeader
                  title={monthName(Number(s.date.slice(5, 7)))}
                  meta={s.date.slice(0, 4)}
                />
              )}
              <PlannedSessionRow session={s} meta={rowMeta(s)} />
            </React.Fragment>
          ))}
        </View>
      )}
    </>
  );
}

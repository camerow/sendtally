import React from "react";
import { View } from "react-native";
import {
  IMPORT_SERVICES,
  type ImportPlan,
  type ImportSession,
  type LikelyDuplicate,
} from "@sendtally/core/import";
import { planStats } from "@sendtally/features/import";
import type { GradeScales } from "@sendtally/features/sessions";
import { useDisplayScales } from "@sendtally/features/settings";
import { formatDate, formatNumber, t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { SectionHeading } from "../../components/SectionHeading";
import { SummaryTiles } from "../training/summary/SummaryTiles";
import { RowIssues } from "./RowIssues";
import { ImportHero } from "./ImportHero";
import { LikelyDuplicates } from "./LikelyDuplicates";
import { SessionsByMonth } from "./SessionsByMonth";

const dayLabel = (date: string): string =>
  formatDate(new Date(`${date}T00:00:00Z`), {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function rowMeta(session: ImportSession, scales: GradeScales): string {
  const sends = session.climbs.filter((c) => c.kind === "send");
  const top = planStats([{ ...session, climbs: sends }], scales).topGrade;
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
  unflagged,
  importing,
  importAnyway,
  onImportAnyway,
}: {
  fileName: string;
  plan: ImportPlan;
  duplicates: LikelyDuplicate[];
  unflagged: ImportSession[];
  importing: ImportSession[];
  importAnyway: boolean;
  onImportAnyway: (value: boolean) => void;
}): React.ReactElement {
  const scales = useDisplayScales();
  const stats = planStats(importing, scales);
  const first = plan.sessions[0]!;
  const last = plan.sessions[plan.sessions.length - 1]!;
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
            { value: formatNumber(stats.sends), label: t("import.statSends") },
            { value: formatNumber(stats.attempts), label: t("import.statAttempts") },
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
      {unflagged.length > 0 && (
        <View>
          <SectionHeading title={t("import.sessionsLabel")} />
          <SessionsByMonth
            rows={[...unflagged]
              .reverse()
              .map((session) => ({ session, meta: rowMeta(session, scales) }))}
          />
        </View>
      )}
    </>
  );
}

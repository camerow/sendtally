import React from "react";
import { View } from "react-native";
import { IMPORT_SERVICES, type ImportPlan, type ImportSession } from "@sendtally/core/import";
import { planStats, sessionTitle } from "@sendtally/features/import";
import { formatDate, formatNumber, t } from "@sendtally/features/i18n";
import { monthName, sessionDay } from "@sendtally/features/sessions";
import { colors } from "@sendtally/design/tokens";
import { SectionHeading } from "../../components/SectionHeading";
import { SectionHeader } from "../sessions/SectionHeader";
import { DayColumn, RowTitle } from "../sessions/SessionRowParts";
import { SummaryTiles } from "../training/summary/SummaryTiles";
import { RowIssues } from "./RowIssues";
import { ImportHero } from "./ImportHero";

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

/** What the file will add to the log: its numbers, the rows it skips, then every session newest first. */
export function ImportReview({
  fileName,
  plan,
}: {
  fileName: string;
  plan: ImportPlan;
}): React.ReactElement {
  const stats = planStats(plan.sessions);
  const first = plan.sessions[0]!;
  const last = plan.sessions[plan.sessions.length - 1]!;
  const newestFirst = [...plan.sessions].reverse();
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
      <View style={{ marginHorizontal: -18 }}>
        <View style={{ paddingHorizontal: 18 }}>
          <SectionHeading title={t("import.sessionsLabel")} />
        </View>
        {newestFirst.map((s, i) => {
          const { weekday, day } = sessionDay({ start_at: `${s.date}T00:00:00Z` });
          return (
            <React.Fragment key={i}>
              {s.date.slice(0, 7) !== newestFirst[i - 1]?.date.slice(0, 7) && (
                <SectionHeader
                  title={monthName(Number(s.date.slice(5, 7)))}
                  meta={s.date.slice(0, 4)}
                />
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 11,
                  paddingHorizontal: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.lineOnLightSoft,
                }}
              >
                <DayColumn weekday={weekday} day={day} />
                <View style={{ flex: 1, gap: 3 }}>
                  <RowTitle
                    title={sessionTitle(s) ?? t("common.climbingSession")}
                    meta={rowMeta(s)}
                  />
                </View>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </>
  );
}

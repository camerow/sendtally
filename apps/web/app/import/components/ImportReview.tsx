import React from "react";
import { planStats, type ImportIssue, type ImportPlan } from "@sendtally/features/import";
import { formatDate, t } from "@sendtally/features/i18n";
import { Section } from "../../settings/components/Section";
import {
  bodyText,
  monoMuted,
  secondaryButton,
  sectionLabel,
  underlineButton,
} from "../../settings/components/styles";
import { goldButton, pillMuted, pillOk, td, tdMono, th } from "../styles";
import { ConversionPrompt } from "./ConversionPrompt";
import { Stat } from "./Stat";

const PREVIEW_ROWS = 8;
const ISSUE_ROWS = 20;

const ISSUE_KEYS = {
  noHeader: "import.issueNoHeader",
  missingDate: "import.issueMissingDate",
  badDate: "import.issueBadDate",
  missingGrade: "import.issueMissingGrade",
  unknownGrade: "import.issueUnknownGrade",
  badKind: "import.issueBadKind",
  badStyle: "import.issueBadStyle",
  badTries: "import.issueBadTries",
  badRpe: "import.issueBadRpe",
  badLocation: "import.issueBadLocation",
  badTime: "import.issueBadTime",
} as const;

const issueText = (issue: ImportIssue): string =>
  t(ISSUE_KEYS[issue.code], { value: issue.value ?? "" });

const dayLabel = (date: string): string =>
  formatDate(new Date(`${date}T00:00:00Z`), {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export type ImportReviewProps = {
  fileName: string;
  plan: ImportPlan;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ImportReview({
  fileName,
  plan,
  busy,
  error,
  onConfirm,
  onCancel,
}: ImportReviewProps): React.ReactElement {
  const [showAll, setShowAll] = React.useState(false);
  const [allIssues, setAllIssues] = React.useState(false);
  const unrecognised = plan.sessions.length === 0;
  const issues = allIssues ? plan.issues : plan.issues.slice(0, ISSUE_ROWS);
  const stats = planStats(plan.sessions);
  const newestFirst = [...plan.sessions].reverse();
  const shown = showAll ? newestFirst : newestFirst.slice(0, PREVIEW_ROWS);
  const first = plan.sessions[0];
  const last = plan.sessions[plan.sessions.length - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span
              style={{
                ...monoMuted,
                fontSize: 11,
                color: "var(--bs-gunmetal)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fileName}
            </span>
            {!unrecognised && (
              <span style={pillOk}>
                {plan.format === "kaya" ? t("import.formatKaya") : t("import.formatSendtally")}
              </span>
            )}
          </span>
          {first !== undefined && last !== undefined && (
            <span style={{ ...monoMuted, whiteSpace: "nowrap" }}>
              {dayLabel(first.date)} – {dayLabel(last.date)}
            </span>
          )}
        </div>
        {!unrecognised && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              paddingTop: 4,
            }}
          >
            <Stat value={stats.sessions} label={t("import.statSessions")} />
            <Stat value={stats.climbs} label={t("import.statClimbs")} />
            <Stat value={stats.topGrade ?? "–"} label={t("import.statTopGrade")} />
            <Stat
              value={plan.issues.length}
              label={t("import.statSkipped")}
              accent={plan.issues.length > 0}
            />
          </div>
        )}
      </Section>

      {!unrecognised && plan.issues.length > 0 && (
        <div
          style={{
            background: "rgba(232,72,85,0.05)",
            border: "1px solid rgba(232,72,85,0.35)",
            borderRadius: "var(--radius-card)",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <span style={sectionLabel}>
            {t("import.skippedTitle", { count: plan.issues.length })}
          </span>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 60 }}>{t("import.row")}</th>
                <th style={{ ...th, width: 200 }}>{t("import.climb")}</th>
                <th style={th}>{t("import.problem")}</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, i) => (
                <tr key={i}>
                  <td style={tdMono}>{issue.row}</td>
                  <td style={td}>{issue.climb ?? ""}</td>
                  <td style={td}>{issueText(issue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!allIssues && plan.issues.length > ISSUE_ROWS && (
            <button type="button" style={underlineButton} onClick={() => setAllIssues(true)}>
              {t("import.showAllRows", { total: plan.issues.length })}
            </button>
          )}
          <p style={bodyText}>{t("import.skippedBody")}</p>
        </div>
      )}

      {unrecognised ? (
        <>
          <p style={bodyText}>{t("import.nothingFound")}</p>
          <ConversionPrompt />
        </>
      ) : (
        <div
          style={{
            background: "var(--bs-white)",
            border: "1px solid var(--line-on-light-soft)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderBottom: "1px solid var(--line-on-light)",
            }}
          >
            <span style={sectionLabel}>{t("import.sessionsLabel")}</span>
            <span style={monoMuted}>
              {t("import.showing", { shown: shown.length, total: plan.sessions.length })}
            </span>
          </div>
          {shown.map((s, i) => {
            const sends = s.climbs.filter((c) => c.kind === "send").length;
            return (
              <div
                key={`${s.date}|${s.name ?? ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 18px",
                  borderBottom:
                    i < shown.length - 1 ? "1px solid var(--line-on-light-soft)" : "none",
                }}
              >
                <span
                  style={{ ...monoMuted, fontSize: 11, color: "var(--bs-gunmetal)", width: 92 }}
                >
                  {dayLabel(s.date)}
                </span>
                <span
                  style={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {s.name ?? s.gym ?? t("common.climbingSession")}
                  </span>
                  <span style={monoMuted}>
                    {t("common.climbCount", { count: s.climbs.length })} ·{" "}
                    {s.location === "indoor" ? t("common.indoor") : t("common.outdoor")} ·{" "}
                    {t("import.sendCount", { count: sends })} · {planStats([s]).topGrade ?? "–"}
                  </span>
                </span>
                <span style={pillMuted}>
                  {s.rpe === undefined
                    ? t("import.rpeScored")
                    : t("import.rpeGiven", { rpe: s.rpe })}
                </span>
              </div>
            );
          })}
          {!showAll && plan.sessions.length > PREVIEW_ROWS && (
            <div style={{ padding: "10px 18px", borderTop: "1px solid var(--line-on-light)" }}>
              <button type="button" style={underlineButton} onClick={() => setShowAll(true)}>
                {t("import.showAll", { total: plan.sessions.length })}
              </button>
            </div>
          )}
        </div>
      )}

      {plan.sessions.length > 0 && <p style={bodyText}>{t("import.reviewNote")}</p>}
      {error !== null && (
        <p style={{ ...bodyText, color: "var(--bs-watermelon-ink)" }}>
          {t("import.failed", { message: error })}
        </p>
      )}
      <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
        {plan.sessions.length > 0 && (
          <button type="button" style={goldButton} disabled={busy} onClick={onConfirm}>
            {busy ? t("import.importing") : t("import.confirm", { count: plan.sessions.length })}
          </button>
        )}
        <button type="button" style={secondaryButton} disabled={busy} onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

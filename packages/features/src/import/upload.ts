import type { ImportResult, SendtallyApi } from "@sendtally/api-client";
import type { ImportIssue, ImportSession } from "@sendtally/core/import";
import { t } from "../i18n";

const BATCH = 200;

const ISSUE_KEYS = {
  noHeader: "import.issueNoHeader",
  missingDate: "import.issueMissingDate",
  noDate: "import.issueNoDate",
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

export const issueText = (issue: ImportIssue): string =>
  t(ISSUE_KEYS[issue.code], { value: issue.value ?? "" });

/** Batches go up in date order so each one is scored after the ones before it. */
export async function importAll(
  api: Pick<SendtallyApi, "importSessions">,
  sessions: ImportSession[]
): Promise<ImportResult> {
  const totals = { imported: 0, skipped: 0 };
  for (let i = 0; i < sessions.length; i += BATCH) {
    const result = await api.importSessions({
      sessions: sessions.slice(i, i + BATCH).map(({ rows: _rows, ...s }) => s),
    });
    totals.imported += result.imported;
    totals.skipped += result.skipped;
  }
  return totals;
}

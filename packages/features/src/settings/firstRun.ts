import type { FirstRunAnswers } from "@sendtally/api-client";
import { IMPORT_SERVICES } from "@sendtally/core/import";
import { t } from "../i18n";

/** An answer to "Do you keep a log already?". */
export type FirstRunSource = Exclude<FirstRunAnswers["existingLog"], "skipped">;

export const FIRST_RUN_SOURCES: readonly FirstRunSource[] = [
  ...(Object.keys(IMPORT_SERVICES) as (keyof typeof IMPORT_SERVICES)[]),
  "spreadsheet",
  "none",
];

export const firstRunSourceLabel = (s: FirstRunSource): string =>
  s === "spreadsheet"
    ? t("onboarding.firstRun.spreadsheet")
    : s === "none"
      ? t("onboarding.firstRun.firstLog")
      : IMPORT_SERVICES[s];

/** The main button for the picked answer: import from it, or carry on. */
export const firstRunNextLabel = (s: FirstRunSource | null): string =>
  s === null || s === "none"
    ? t("onboarding.firstRun.continue")
    : s === "spreadsheet"
      ? t("onboarding.firstRun.importSpreadsheet")
      : t("onboarding.firstRun.importFrom", { source: firstRunSourceLabel(s) });

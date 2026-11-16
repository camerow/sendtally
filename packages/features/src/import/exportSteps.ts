import { exportPageUrl, IMPORT_SERVICES } from "@sendtally/core/import";
import { t } from "../i18n";

export type ExportService = keyof typeof IMPORT_SERVICES;

/** Where first run says the log is kept, which the import page opens on. */
export type ImportSource = ExportService | "spreadsheet";

/** The `from` an import page was opened with, when it names a source. */
export const importSourceOf = (from: string | null | undefined): ImportSource | undefined =>
  from === "spreadsheet" || (from != null && Object.hasOwn(IMPORT_SERVICES, from))
    ? (from as ImportSource)
    : undefined;

/** How to get the export out of a service, in order; Kaya documents none, so it has no steps. */
export function exportSteps(service: ExportService): string[] {
  const choose = t("import.howToChoose");
  // Menu names stay as each service writes them, in English, in every locale. 8a.nu's come from
  // Kaya's and theCrag's help pages, since 8a.nu documents none.
  switch (service) {
    case "kaya":
      return [];
    case "8a":
      return [
        t("import.howTo8a1", { logbook: "My Logbook" }),
        t("import.howTo8a2", { about: "About" }),
        t("import.howTo8a3", { export: "Logbook Export (CSV)" }),
        `${choose} ${t("import.howTo8aTries")}`,
      ];
    case "mountainProject":
      return [
        t("import.howToMountainProject1"),
        t("import.howToMountainProject2", { ticks: "Ticks" }),
        t("import.howToMountainProject3", { export: "Export CSV" }),
        choose,
      ];
    case "sendage":
      return [t("import.howToSendage1"), t("import.howToSendage2"), choose];
    case "theCrag":
      return [
        t("import.howToTheCrag1"),
        t("import.howToTheCrag2", { menu: "Action", export: "Select logbook as CSV" }),
        t("import.howToTheCrag3"),
        choose,
      ];
  }
}

/** The label of the link beside the steps: the site it opens, or a search where there is none. */
export function exportLinkLabel(service: ExportService): string {
  return service === "kaya"
    ? t("import.howToSearch", { service: IMPORT_SERVICES.kaya })
    : t("import.howToOpen", {
        site: new URL(exportPageUrl(service)).hostname.replace(/^www\./, ""),
      });
}

/** Steps as a description's numbered lines, so both apps draw them as any other steps. */
export const stepsText = (steps: readonly string[]): string =>
  steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

/** What a CSV can arrive as: a file saved from a browser is often plain text. */
export const CSV_TYPES = ["text/csv", "text/comma-separated-values", "text/plain"];

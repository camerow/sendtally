import { IMPORT_SERVICES } from "@sendtally/core/import";
import { t } from "../i18n";

export type ExportService = keyof typeof IMPORT_SERVICES;

/** Where first run says the log is kept, which the import page opens on. */
export type ImportSource = ExportService | "spreadsheet";

/** The `from` an import page was opened with, when it names a source. */
export const importSourceOf = (from: string | null | undefined): ImportSource | undefined =>
  from === "spreadsheet" || (from != null && Object.hasOwn(IMPORT_SERVICES, from))
    ? (from as ImportSource)
    : undefined;

// Menu names stay as each service writes them, in English, in every locale. 8a.nu's come from
// Kaya's and theCrag's help pages, since 8a.nu documents none; keep them here to update in one place.
const MENUS = {
  logbook: "My Logbook",
  about: "About",
  eightAExport: "Logbook Export (CSV)",
  ticks: "Ticks",
  ticksExport: "Export CSV",
  action: "Action",
  logbookCsv: "Select logbook as CSV",
};

/** How to get the export out of a service, in order; Kaya documents none, so it has no steps. */
export function exportSteps(service: ExportService): string[] {
  const choose = t("import.howToChoose");
  switch (service) {
    case "kaya":
      return [];
    case "8a":
      return [
        t("import.howTo8a1", { logbook: MENUS.logbook }),
        t("import.howTo8a2", { about: MENUS.about }),
        t("import.howTo8a3", { export: MENUS.eightAExport }),
        t("import.howTo8a4"),
      ];
    case "mountainProject":
      return [
        t("import.howToMountainProject1"),
        t("import.howToMountainProject2", { ticks: MENUS.ticks }),
        t("import.howToMountainProject3", { export: MENUS.ticksExport }),
        choose,
      ];
    case "sendage":
      return [t("import.howToSendage1"), t("import.howToSendage2"), choose];
    case "theCrag":
      return [
        t("import.howToTheCrag1"),
        t("import.howToTheCrag2", { menu: MENUS.action, export: MENUS.logbookCsv }),
        t("import.howToTheCrag3"),
        choose,
      ];
  }
}

/** The label of the link beside the steps: the site it opens, or a search where there is none. */
export function exportLinkLabel(service: ExportService, url: string, name: string): string {
  return service === "kaya"
    ? t("import.howToSearch", { service: name })
    : t("import.howToOpen", { site: new URL(url).hostname.replace(/^www\./, "") });
}

/** Steps as a description's numbered lines, so both apps draw them as any other steps. */
export const stepsText = (steps: readonly string[]): string =>
  steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

/** What a CSV can arrive as: a file saved from a browser is often plain text. */
export const CSV_TYPES = ["text/csv", "text/comma-separated-values", "text/plain"];

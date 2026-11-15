import type { ImportResult } from "@sendtally/api-client";
import { t } from "../i18n";

export function importResultText({
  imported,
  skipped,
  likely,
}: ImportResult & { likely: number }): string {
  const added =
    imported === 0
      ? t("import.allThere", { total: skipped })
      : skipped === 0
        ? t("import.added", { count: imported })
        : t("import.addedSome", { added: imported, skipped });
  return likely === 0 ? added : `${added} · ${t("import.likelySkipped", { count: likely })}`;
}

/** An import's result as it comes back in a screen's params; null when it did not come back from one. */
export function readImportResult(
  get: (key: string) => string | null | undefined
): (ImportResult & { likely: number }) | null {
  const imported = get("imported");
  if (imported === null || imported === undefined) return null;
  return {
    imported: Number(imported),
    skipped: Number(get("skipped") ?? 0),
    likely: Number(get("likely") ?? 0),
  };
}

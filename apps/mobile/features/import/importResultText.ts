import type { ImportResult } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";

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

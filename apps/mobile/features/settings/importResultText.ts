import type { ImportResult } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";

export function importResultText({ imported, skipped }: ImportResult): string {
  if (imported === 0) return t("import.allThere", { total: skipped });
  if (skipped === 0) return t("import.added", { count: imported });
  return t("import.addedSome", { added: imported, skipped });
}

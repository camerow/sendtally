import { NetworkError } from "@sendtally/api-client";
import { t } from "../i18n";

/** What a failed request says to the person: the server's own words, never a runtime's. */
export function errorMessage(error: unknown): string {
  if (error instanceof NetworkError) return t("common.unreachable");
  return error instanceof Error && error.message !== ""
    ? error.message
    : t("common.somethingWentWrong");
}

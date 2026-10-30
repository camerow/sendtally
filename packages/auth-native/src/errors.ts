import { t } from "@sendtally/features/i18n";

type ClerkErrorBody = { errors?: Array<{ code?: string; longMessage?: string; message?: string }> };

function firstError(err: unknown): NonNullable<ClerkErrorBody["errors"]>[number] | undefined {
  return typeof err === "object" && err !== null ? (err as ClerkErrorBody).errors?.[0] : undefined;
}

export function errorMessage(err: unknown): string {
  const first = firstError(err);
  return first?.longMessage ?? first?.message ?? t("common.somethingWentWrongTryAgain");
}

export function errorCode(err: unknown): string | undefined {
  return firstError(err)?.code;
}

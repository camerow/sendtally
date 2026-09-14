import type { SessionRow } from "@sendtally/api-client";
import { t } from "../i18n";
import { BOARD_LABELS } from "../session-detail/types";

export function sessionTitle(session: Pick<SessionRow, "name" | "source" | "board">): string {
  if (session.name !== null && session.name !== "") return session.name;
  if (session.source === "manual") return t("sessions.loggedSession");
  return BOARD_LABELS[session.board ?? ""] ?? t("sessions.boardSession");
}

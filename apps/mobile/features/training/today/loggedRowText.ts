import type { SessionRow } from "@sendtally/api-client";
import type { HangModel } from "@sendtally/features/hang";
import { sessionMetaLabel, sessionTitle } from "@sendtally/features/sessions";
import { activityMetaLabel } from "@sendtally/features/activities";
import { itemEffort, type LoggedItem } from "@sendtally/features/training";
import { sessionText } from "../sessions/sessionText";
import { kindName } from "./kindLook";

export type LoggedRowText = { name: string; meta: string; right: string; rpe: number | null };

const topSend = (s: SessionRow): string =>
  s.top_send_grade < 0 ? "" : (s.top_send_grade_label ?? `V${s.top_send_grade}`);

export function loggedRowText(item: LoggedItem, model: HangModel): LoggedRowText {
  const rpe = itemEffort(item);
  if (item.kind === "activity") {
    return { name: item.activity.title, meta: activityMetaLabel(item.activity), right: "", rpe };
  }
  if (item.kind === "climb") {
    return {
      name: sessionTitle(item.session),
      meta: [kindName("climb"), sessionMetaLabel(item.session)].join(" · "),
      right: topSend(item.session),
      rpe,
    };
  }
  const text = sessionText(item.session, model);
  return {
    name: text.name,
    meta: [kindName("hang"), text.grip, `${item.session.pct}%`].join(" · "),
    right: text.load,
    rpe,
  };
}

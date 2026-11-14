import type { SessionRow } from "@sendtally/api-client";
import type { HangModel } from "../hang/model";
import { sessionGradeLabel, type GradeScales } from "../sessions/grades";
import { sessionTallyLabel } from "../sessions/meta";
import { sessionTitle } from "../sessions/title";
import { activityMetaLabel, kindLabel } from "../activities/format";
import { itemEffort, type LoggedItem } from "./days";
import { sessionText } from "./sessionText";

export type LoggedRowText = { name: string; meta: string; right: string; rpe: number | null };

const topSend = (s: SessionRow, scales: GradeScales): string =>
  s.top_send_grade < 0 ? "" : sessionGradeLabel(s.top_send_grade_label, s.top_send_grade, scales);

export function loggedRowText(
  item: LoggedItem,
  model: HangModel,
  scales: GradeScales
): LoggedRowText {
  const rpe = itemEffort(item);
  if (item.kind === "activity") {
    return { name: item.activity.title, meta: activityMetaLabel(item.activity), right: "", rpe };
  }
  if (item.kind === "climb") {
    return {
      name: sessionTitle(item.session),
      meta: [kindLabel("climbing"), sessionTallyLabel(item.session, scales, false)].join(" · "),
      right: topSend(item.session, scales),
      rpe,
    };
  }
  const text = sessionText(item.session, model);
  return {
    name: text.name,
    meta: [kindLabel("hangboard"), text.grip, `${item.session.pct}%`].join(" · "),
    right: text.load,
    rpe,
  };
}

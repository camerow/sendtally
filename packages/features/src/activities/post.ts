import type { ActivityRecord } from "@sendtally/api-client";
import { formatDate, t } from "../i18n";
import type { PostingStatus, PostStatusVM } from "../session-detail/types";

/** Where an activity stands with Strava, and what the user can do about it. */
export function activityPostVM(a: ActivityRecord, posting: PostingStatus | null): PostStatusVM {
  const base = { detail: null, alert: false, action: null, actionLabel: null } as const;
  if (a.stravaActivityId !== null) {
    const on = new Date(a.postedAt ?? `${a.date}T12:00:00Z`);
    const date = formatDate(on, { month: "short", day: "numeric", timeZone: "UTC" });
    return { ...base, kind: "posted", label: t("sessionDetail.postedOn", { date }) };
  }
  if (a.postState === "pending") {
    return { ...base, kind: "pending", label: t("sessionDetail.postingToStrava") };
  }
  const postable = posting !== null && posting.connected && posting.active;
  if (a.postState === "failed") {
    return {
      kind: "failed",
      label: t("sessionDetail.notPostedToStrava"),
      detail: a.postError,
      alert: true,
      action: postable ? "retry" : null,
      actionLabel: postable ? t("sessionDetail.retry") : null,
    };
  }
  return {
    ...base,
    kind: "off",
    label: t("sessionDetail.notPostedToStrava"),
    action: postable ? "post" : null,
    actionLabel: postable ? t("sessionDetail.postToStrava") : null,
  };
}

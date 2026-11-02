import type { StravaState } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import type { DetailMenuRow } from "../components/types";

/** A finished workout's Strava row: connect, post, retry or view, as the state says. */
export function stravaRow(
  state: StravaState,
  rpe: number | null,
  onPress: () => void
): DetailMenuRow {
  const postHint =
    rpe === null ? t("summary.postHintNoEffort") : t("summary.postHint", { rpe: String(rpe) });
  const row = { icon: "strava", onPress } as const;
  switch (state.kind) {
    case "connect":
      return { ...row, title: t("summary.connectStrava"), hint: t("summary.connectHint") };
    case "post":
      return { ...row, title: t("sessionDetail.postToStrava"), hint: postHint, keepOpen: true };
    case "posting":
      return { ...row, title: t("summary.posting"), hint: postHint, busy: true, keepOpen: true };
    case "posted":
      return { ...row, title: t("summary.viewOnStrava"), hint: t("summary.viewHint") };
    case "failed":
      return {
        ...row,
        title: t("summary.tryAgain"),
        hint: state.reason ?? t("summary.tryAgainHint"),
        keepOpen: true,
      };
  }
}

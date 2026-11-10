import type { StravaState } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import type { DetailMenuRow } from "../components/types";

/** A finished workout's Strava row: connect, post, retry or view, as the state says. */
export function stravaRow(state: StravaState, onPress: () => void): DetailMenuRow {
  const row = { icon: "strava", onPress } as const;
  switch (state.kind) {
    case "connect":
      return { ...row, title: t("summary.connectStrava") };
    case "post":
      return { ...row, title: t("sessionDetail.postToStrava"), keepOpen: true };
    case "posting":
      return { ...row, title: t("summary.posting"), busy: true, keepOpen: true };
    case "posted":
      return { ...row, title: t("summary.viewOnStrava") };
    case "failed":
      return {
        ...row,
        title: t("summary.tryAgain"),
        ...(state.reason != null && { hint: state.reason }),
        keepOpen: true,
      };
  }
}

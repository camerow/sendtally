import { t } from "../i18n";
import type { StravaState } from "./post";

/** A finished workout's Strava action as its menu names it: connect, post, retry or view. */
export function stravaLabel(state: StravaState): string {
  switch (state.kind) {
    case "connect":
      return t("summary.connectStrava");
    case "post":
      return t("sessionDetail.postToStrava");
    case "posting":
      return t("summary.posting");
    case "posted":
      return t("summary.viewOnStrava");
    case "failed":
      return t("summary.tryAgain");
  }
}

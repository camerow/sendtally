import type { StravaState } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import type { MoreMenuItem } from "../MoreMenu";

/** A finished workout's Strava row in its ··· menu: connect, post, retry or view, as the state says. */
export function stravaMenuItem(state: StravaState, onSelect: () => void): MoreMenuItem {
  const label = (): string => {
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
  };
  return { label: label(), onSelect, disabled: state.kind === "posting" };
}

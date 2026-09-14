import { redirect } from "react-router";
import { pageMeta } from "../lib/seo";
import { t } from "@sendtally/features/i18n";

export function meta(): Array<Record<string, string>> {
  return pageMeta({
    title: t("web.auth.stravaConnectedTitle"),
    path: "/connected/strava",
    noindex: true,
  });
}

export function loader(): Response {
  return redirect("/app/setup");
}

import { redirect } from "react-router";
import { pageMeta } from "../lib/seo";

export function meta(): Array<Record<string, string>> {
  return pageMeta({
    title: "Strava connected - sendtally",
    path: "/connected/strava",
    noindex: true,
  });
}

export function loader(): Response {
  return redirect("/app/setup");
}

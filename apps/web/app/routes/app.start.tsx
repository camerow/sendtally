import React from "react";
import type { LinksFunction } from "react-router";
import { useSearchParams } from "react-router";
import { queries, useQuery } from "@sendtally/features/query";
import type { OnboardingPath, PathFrom } from "@sendtally/features/settings";
import climbsStyles from "../climbs/climbs.css?url";
import billingStyles from "../billing/billing.css?url";
import blocksStyles from "../training/blocks/blocks.css?url";
import planStyles from "../training/plan-week/plan.css?url";
import playerStyles from "../training/players/players.css?url";
import trainingStyles from "../training/training.css?url";
import firstRunStyles from "../first-run/first-run.css?url";
import historyStyles from "../first-run/history/history.css?url";
import planPathStyles from "../first-run/plan/plan-path.css?url";
import { OnboardingWizard } from "../first-run/OnboardingWizard";
import { useAppApi } from "../lib/useAppApi";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: trainingStyles },
  { rel: "stylesheet", href: blocksStyles },
  { rel: "stylesheet", href: climbsStyles },
  { rel: "stylesheet", href: planStyles },
  { rel: "stylesheet", href: firstRunStyles },
  { rel: "stylesheet", href: historyStyles },
  { rel: "stylesheet", href: planPathStyles },
  { rel: "stylesheet", href: billingStyles },
  { rel: "stylesheet", href: playerStyles },
];

/** The onboarding wizard, opened once the status says where the user stands, so it resumes at the first step not done. */
export default function StartRoute(): React.ReactElement | null {
  const [params] = useSearchParams();
  const api = useAppApi();
  const { state } = useQuery(queries.status(api));
  const asked = params.get("path");
  const path: OnboardingPath | null = asked === "history" || asked === "plan" ? asked : null;
  const from: PathFrom = params.get("from") === "setup_card" ? "setup_card" : "account";
  const start = React.useMemo(() => (path === null ? undefined : { path, from }), [path, from]);
  if (state.status !== "ready") return null;
  return <OnboardingWizard api={api} start={start} />;
}

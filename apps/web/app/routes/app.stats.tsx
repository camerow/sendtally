import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import climbsStyles from "../climbs/climbs.css?url";
import { getMembership } from "../lib/billing.server";
import sessionsStyles from "../sessions/sessions.css?url";
import { StatsView } from "../stats/components/StatsView";
import statsStyles from "../stats/stats.css?url";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: climbsStyles },
  { rel: "stylesheet", href: statsStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<{ member: boolean }> {
  return { member: (await getMembership(args)).active };
}

export default function StatsRoute(): React.ReactElement {
  const { member } = useLoaderData<typeof loader>();
  return <StatsView member={member} />;
}

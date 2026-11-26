import React from "react";
import type { LinksFunction } from "react-router";
import climbsStyles from "../climbs/climbs.css?url";
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

export default function StatsRoute(): React.ReactElement {
  return <StatsView />;
}

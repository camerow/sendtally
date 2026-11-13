import React from "react";
import type { LinksFunction } from "react-router";
import pageActionStyles from "../components/page-action.css?url";
import sessionsStyles from "../sessions/sessions.css?url";
import planStyles from "../training/plan-week/plan.css?url";
import { PlanPage } from "../training/plan-week/PlanPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: trainingStyles },
  { rel: "stylesheet", href: pageActionStyles },
  { rel: "stylesheet", href: planStyles },
];

export default function PlanRoute(): React.ReactElement {
  return <PlanPage />;
}

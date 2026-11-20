import React from "react";
import type { LinksFunction } from "react-router";
import setupStackStyles from "../components/setup-stack.css?url";
import sessionsStyles from "../sessions/sessions.css?url";
import planStyles from "../training/plan-week/plan.css?url";
import blockStyles from "../training/blocks/blocks.css?url";
import { PlanPage } from "../training/plan-week/PlanPage";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: blockStyles },
  { rel: "stylesheet", href: planStyles },
  { rel: "stylesheet", href: setupStackStyles },
];

export default function PlanRoute(): React.ReactElement {
  return <PlanPage />;
}

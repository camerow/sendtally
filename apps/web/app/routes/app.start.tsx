import React from "react";
import type { LinksFunction } from "react-router";
import planStyles from "../training/plan-week/plan.css?url";
import firstRunStyles from "../first-run/first-run.css?url";
import { FirstRunPage } from "../first-run/FirstRunPage";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: planStyles },
  { rel: "stylesheet", href: firstRunStyles },
];

export default function StartRoute(): React.ReactElement {
  return <FirstRunPage />;
}

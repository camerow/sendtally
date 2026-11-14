import React from "react";
import type { LinksFunction } from "react-router";
import { OngoingPage } from "../training/plan-calendar/OngoingPage";
import planStyles from "../training/plan-week/plan.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: planStyles }];

export default function Route(): React.ReactElement {
  return <OngoingPage />;
}

import React from "react";
import type { LinksFunction } from "react-router";
import { CalendarPage } from "../training/plan-calendar/CalendarPage";
import planStyles from "../training/plan-week/plan.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: planStyles }];

export default function Route(): React.ReactElement {
  return <CalendarPage />;
}

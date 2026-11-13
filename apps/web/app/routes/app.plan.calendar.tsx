import React from "react";
import type { LinksFunction } from "react-router";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { CalendarPage } from "../training/plan-calendar/CalendarPage";
import planStyles from "../training/plan-week/plan.css?url";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: trainingStyles },
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: planStyles },
];

export default function Route(): React.ReactElement {
  return (
    <HangDataProvider>
      <CalendarPage />
    </HangDataProvider>
  );
}

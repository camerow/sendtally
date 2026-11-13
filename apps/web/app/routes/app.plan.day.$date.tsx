import React from "react";
import type { LinksFunction } from "react-router";
import { redirect, useParams, type LoaderFunctionArgs } from "react-router";
import { isCalendarDate } from "@sendtally/core/hang";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { PlanDayPage } from "../training/plan-calendar/PlanDayPage";
import planStyles from "../training/plan-week/plan.css?url";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: trainingStyles },
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: planStyles },
];

/** A day that is not one goes back to the calendar. */
export function loader({ params }: LoaderFunctionArgs): null {
  if (!isCalendarDate(params.date ?? "")) throw redirect("/app/plan/calendar");
  return null;
}

export default function PlanDayRoute(): React.ReactElement {
  const { date = "" } = useParams();
  return (
    <HangDataProvider>
      <PlanDayPage date={date} />
    </HangDataProvider>
  );
}

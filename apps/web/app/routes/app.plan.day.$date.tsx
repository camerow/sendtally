import React from "react";
import type { LinksFunction } from "react-router";
import { redirect, useParams, type LoaderFunctionArgs } from "react-router";
import { isCalendarDate } from "@sendtally/core/hang";
import { PlanDayPage } from "../training/plan-calendar/PlanDayPage";
import planStyles from "../training/plan-week/plan.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: planStyles }];

/** A day that is not one goes back to the calendar. */
export function loader({ params }: LoaderFunctionArgs): null {
  if (!isCalendarDate(params.date ?? "")) throw redirect("/app/plan/calendar");
  return null;
}

export default function PlanDayRoute(): React.ReactElement {
  const { date = "" } = useParams();
  return <PlanDayPage date={date} />;
}

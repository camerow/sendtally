import React from "react";
import { useParams, useSearchParams } from "react-router";
import { WorkoutHistoryPage } from "../training/history/WorkoutHistoryPage";

export default function WorkoutHistoryRoute(): React.ReactElement {
  const [params] = useSearchParams();
  const current = params.get("current");
  return <WorkoutHistoryPage id={useParams().id ?? ""} {...(current !== null && { current })} />;
}

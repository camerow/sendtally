import React from "react";
import { useParams } from "react-router";

import { WorkoutSummaryPage } from "../training/summary/WorkoutSummaryPage";

export default function Route(): React.ReactElement {
  const id = useParams().id ?? "";
  return <WorkoutSummaryPage id={id} />;
}

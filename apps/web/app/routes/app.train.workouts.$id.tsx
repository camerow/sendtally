import React from "react";
import { useParams } from "react-router";
import { WorkoutPage } from "../training/library-detail/WorkoutPage";

export default function WorkoutRoute(): React.ReactElement {
  return <WorkoutPage id={useParams().id ?? ""} />;
}

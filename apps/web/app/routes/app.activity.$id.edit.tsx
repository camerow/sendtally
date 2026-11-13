import React from "react";
import { useParams } from "react-router";

import { WorkoutEditPage } from "../training/log/WorkoutEditPage";

export default function Route(): React.ReactElement {
  const id = useParams().id ?? "";
  return <WorkoutEditPage id={id} />;
}

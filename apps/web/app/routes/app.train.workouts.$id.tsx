import React from "react";
import { useParams, useSearchParams } from "react-router";
import { WorkoutPage } from "../training/library-detail/WorkoutPage";

export default function WorkoutRoute(): React.ReactElement {
  const [params] = useSearchParams();
  const date = params.get("date");
  const membershipId = params.get("membershipId");
  return (
    <WorkoutPage
      id={useParams().id ?? ""}
      run={date === null || membershipId === null ? null : { date, membershipId }}
    />
  );
}

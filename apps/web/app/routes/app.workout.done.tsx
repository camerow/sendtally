import React from "react";
import { useSearchParams } from "react-router";
import { readDoneParams } from "@sendtally/features/workouts";
import { HangReview } from "../training/log/HangReview";

export default function Route(): React.ReactElement {
  const [params] = useSearchParams();
  return <HangReview params={readDoneParams(Object.fromEntries(params))} />;
}

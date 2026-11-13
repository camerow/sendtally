import React from "react";
import type { LinksFunction } from "react-router";
import { useSearchParams } from "react-router";
import { readDoneParams } from "@sendtally/features/workouts";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { HangReview } from "../training/log/HangReview";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function Route(): React.ReactElement {
  const [params] = useSearchParams();
  return (
    <HangDataProvider>
      <HangReview params={readDoneParams(Object.fromEntries(params))} />
    </HangDataProvider>
  );
}

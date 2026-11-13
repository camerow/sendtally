import React from "react";
import type { LinksFunction } from "react-router";
import { Navigate, useParams } from "react-router";
import { readFocus } from "@sendtally/features/training";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { CategoryPage } from "../training/library/CategoryPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function WorkoutCategoryRoute(): React.ReactElement {
  const focus = readFocus(useParams().focus);
  if (focus === undefined) return <Navigate to="/app/train" replace />;
  return (
    <HangDataProvider>
      <CategoryPage focus={focus} />
    </HangDataProvider>
  );
}

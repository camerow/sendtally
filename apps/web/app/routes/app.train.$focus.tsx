import React from "react";
import { Navigate, useParams } from "react-router";
import { readFocus } from "@sendtally/features/training";
import { CategoryPage } from "../training/library/CategoryPage";

export default function WorkoutCategoryRoute(): React.ReactElement {
  const focus = readFocus(useParams().focus);
  if (focus === undefined) return <Navigate to="/app/train" replace />;
  return <CategoryPage focus={focus} />;
}

import React from "react";
import type { LinksFunction } from "react-router";
import detailStyles from "../components/detail/detail.css?url";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { CompareGripsPage } from "../training/grip/CompareGripsPage";
import trainingStyles from "../training/training.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export default function CompareGripsRoute(): React.ReactElement {
  return (
    <HangDataProvider>
      <CompareGripsPage />
    </HangDataProvider>
  );
}

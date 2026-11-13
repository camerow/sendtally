import React from "react";
import type { LinksFunction } from "react-router";
import { useParams } from "react-router";
import blockStyles from "../training/blocks/blocks.css?url";
import { LadderPage } from "../training/blocks/LadderPage";
import planStyles from "../training/plan-week/plan.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: planStyles },
  { rel: "stylesheet", href: blockStyles },
];

export default function LadderRoute(): React.ReactElement {
  const { id = "" } = useParams();
  return <LadderPage key={id} id={id} />;
}

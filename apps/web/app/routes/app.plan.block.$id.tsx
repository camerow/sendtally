import React from "react";
import type { LinksFunction } from "react-router";
import { useParams, useSearchParams } from "react-router";
import blockStyles from "../training/blocks/blocks.css?url";
import { BlockPage } from "../training/blocks/BlockPage";
import planStyles from "../training/plan-week/plan.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: planStyles },
  { rel: "stylesheet", href: blockStyles },
];

export default function BlockRoute(): React.ReactElement {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  return <BlockPage key={id} id={id} fresh={params.get("fresh") === "1"} />;
}

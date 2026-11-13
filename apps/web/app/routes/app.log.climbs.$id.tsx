import React from "react";
import type { LinksFunction } from "react-router";
import { useParams } from "react-router";
import { ClimbDetail } from "../climbs/components/ClimbDetail";
import climbsStyles from "../climbs/climbs.css?url";
import detailStyles from "../components/detail/detail.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: climbsStyles },
];

export default function ClimbDetailRoute(): React.ReactElement {
  const { id = "" } = useParams();
  return <ClimbDetail key={id} id={id} />;
}

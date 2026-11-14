import React from "react";
import type { LinksFunction } from "react-router";
import { useLocation } from "react-router";
import { AddClimb } from "../climbs/components/AddClimb";
import climbsStyles from "../climbs/climbs.css?url";
import detailStyles from "../components/detail/detail.css?url";
import logSessionStyles from "../log-session/log-session.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: logSessionStyles },
  { rel: "stylesheet", href: climbsStyles },
];

export default function AddClimbRoute(): React.ReactElement {
  return <AddClimb key={useLocation().search} />;
}

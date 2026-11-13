import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useParams } from "react-router";
import climbsStyles from "../climbs/climbs.css?url";
import detailStyles from "../components/detail/detail.css?url";
import stravaStyles from "../components/detail/strava.css?url";
import { requireApi } from "../lib/api.server";
import { SessionDetail } from "../session-detail/components/SessionDetail";
import sessionsStyles from "../sessions/sessions.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sessionsStyles },
  { rel: "stylesheet", href: detailStyles },
  { rel: "stylesheet", href: stravaStyles },
  { rel: "stylesheet", href: climbsStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<null> {
  await requireApi(args);
  return null;
}

export default function SessionDetailRoute(): React.ReactElement {
  const { fingerprint = "" } = useParams();
  return <SessionDetail key={fingerprint} fingerprint={fingerprint} />;
}

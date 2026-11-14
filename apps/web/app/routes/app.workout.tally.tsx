import React from "react";
import type { LinksFunction } from "react-router";
import { TallyPage } from "../live-session/components/TallyPage";
import liveStyles from "../live-session/live-session.css?url";
import logSessionStyles from "../log-session/log-session.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: logSessionStyles },
  { rel: "stylesheet", href: liveStyles },
];

/** The tally logging the workout exercise a player started it on. */
export default function ExerciseTallyRoute(): React.ReactElement | null {
  return <TallyPage exercise />;
}

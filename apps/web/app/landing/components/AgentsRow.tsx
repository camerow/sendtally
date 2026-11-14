import React from "react";
import { Label } from "@sendtally/design";
import { AGENTS as agents } from "../agentsCopy";
import { AskCard } from "./AskCard";
import { CopyUrl } from "./CopyUrl";
import { Reveal } from "./Reveal";
import { Shot } from "./Shot";

/** The homepage row for agents: what to ask, the connector URL, and what lands in the app. */
export function AgentsRow({ url }: { url: string }): React.ReactElement {
  return (
    <section id="agents" className="l-feature l-feature--white l-agents">
      <Reveal className="l-feature-copy">
        <Label on="accent">{agents.eyebrow}</Label>
        <h2 className="l-feature-title">{agents.title}</h2>
        <p className="l-feature-body">{agents.body}</p>
        <ul className="l-points">
          {agents.home.points.map((point) => (
            <li key={point}>
              <span className="l-tick" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <CopyUrl url={url} />
        <a href="/agents" className="l-textlink l-textlink--plain">
          {agents.home.more}
        </a>
      </Reveal>
      <Reveal delay={120} className="l-feature-media l-agents-media">
        <AskCard />
        <Shot media={agents.home.media} />
      </Reveal>
    </section>
  );
}

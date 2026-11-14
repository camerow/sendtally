import React from "react";
import { AGENTS } from "../agentsCopy";

/** What a climber types to their agent and the one-line answer, drawn without any assistant's branding. */
export function AskCard(): React.ReactElement {
  const { ask } = AGENTS.home;
  return (
    <figure className="l-ask">
      <figcaption className="l-ask-label">{ask.label}</figcaption>
      <div className="l-ask-box">
        <p className="l-ask-prompt">{ask.prompt}</p>
        <span className="l-ask-send" role="img" aria-label={ask.send} />
      </div>
      <p className="l-ask-reply">{ask.reply}</p>
    </figure>
  );
}

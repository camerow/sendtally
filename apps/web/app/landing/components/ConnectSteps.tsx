import React from "react";
import { Label } from "@sendtally/design";
import { AGENTS } from "../agentsCopy";
import { CopyUrl } from "./CopyUrl";

export function ConnectSteps({ url }: { url: string }): React.ReactElement {
  const { connect } = AGENTS;
  return (
    <section id="connect" className="l-connect">
      <Label on="accent">{connect.eyebrow}</Label>
      <h2 className="l-pricing-h2">{connect.title}</h2>
      <ol className="l-connect-steps">
        {connect.steps.map((step) => (
          <li key={step.title} className="l-extra">
            <Label on="accent">{step.label}</Label>
            <span className="l-extra-title">{step.title}</span>
            {"body" in step ? (
              <span className="l-extra-body">{step.body}</span>
            ) : (
              <CopyUrl url={url} />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

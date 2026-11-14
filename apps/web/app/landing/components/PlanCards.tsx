import React from "react";
import { useLanding } from "../LandingContext";
import { AccountCta } from "./AccountCta";
import { AppStores } from "./AppStores";
import { WebAccountLink } from "./WebAccountLink";

function Points({ points }: { points: string[] }): React.ReactElement {
  return (
    <ul className="l-plan-list">
      {points.map((point) => (
        <li key={point} className="l-plan-row">
          <span className="l-tick" aria-hidden="true" />
          {point}
        </li>
      ))}
    </ul>
  );
}

export function PlanCards(): React.ReactElement {
  const { copy } = useLanding();
  const { free, member } = copy.pricing;
  return (
    <section className="l-plans">
      <div className="l-plan">
        <div className="l-plan-head">
          <span className="l-plan-name">{free.name}</span>
          <span className="l-plan-amount">
            <b>{free.amount}</b>
            {free.suffix}
          </span>
        </div>
        <span className="l-plan-sub">{free.sub}</span>
        <Points points={free.points} />
        <div className="l-plan-foot">
          <AppStores prominent />
          <WebAccountLink label={free.webAccount} />
        </div>
      </div>
      <div className="l-plan l-plan--member">
        <div className="l-plan-head">
          <span className="l-plan-name">{member.name}</span>
          <span className="l-plan-amount">
            <b>{member.amount}</b>
            {member.suffix}
          </span>
        </div>
        <span className="l-plan-sub">{member.sub}</span>
        <Points points={member.points} />
        <div className="l-plan-foot">
          <AccountCta label={member.cta} className="l-plan-cta" />
          <span className="l-plan-note">{member.note}</span>
        </div>
      </div>
    </section>
  );
}

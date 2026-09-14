import React from "react";
import { useLanding } from "../LandingContext";
import { Label } from "@sendtally/design";
import { insightSeries } from "./insightSeries";
import { MiniBars } from "./MiniBars";
import { AccountCta } from "./AccountCta";
import { Reveal } from "./Reveal";

function PlanHeader({
  name,
  amount,
  suffix,
}: {
  name: string;
  amount: string;
  suffix: string;
}): React.ReactElement {
  return (
    <div className="l-plan-head">
      <span className="l-plan-name">{name}</span>
      <span className="l-plan-amount">
        <b>{amount}</b>
        {suffix}
      </span>
    </div>
  );
}

function FreePlan(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <Reveal className="l-plan">
      <PlanHeader {...copy.price.free} />
      <ul className="l-plan-list">
        {copy.free.features.map((f) => (
          <li key={f.eyebrow} className="l-plan-row">
            <span className="l-tick l-tick--sm" aria-hidden="true" />
            <span>{f.short}</span>
          </li>
        ))}
      </ul>
      <div className="l-plan-actions">
        <span className="l-plan-foot">{copy.price.free.footnote}</span>
        <AccountCta variant="ghostOnLight" label={copy.price.free.cta} />
      </div>
    </Reveal>
  );
}

function MemberPlan(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <Reveal delay={80} className="l-plan l-plan--member">
      <PlanHeader {...copy.price.member} />
      <ul className="l-plan-list">
        {insightSeries(copy).map((s) => (
          <li key={s.metric} className="l-plan-row">
            <span className="l-plan-mini">
              <MiniBars
                bars={s.bars.map(({ key, value, peak }) => ({ key, value, peak }))}
                height={26}
                gap={2}
                grow="in-view"
              />
            </span>
            <span className="l-plan-text">
              <Label on="dark" size={10}>
                {s.eyebrow}
              </Label>
              <span>{s.memberLine}</span>
            </span>
          </li>
        ))}
        <li className="l-plan-row">
          <span className="l-plan-mini l-plan-mini--plus" aria-hidden="true">
            +
          </span>
          <span className="l-plan-text">
            <Label on="dark" size={10} style={{ color: "rgba(238,211,248,0.7)" }}>
              {copy.price.member.roadmapEyebrow}
            </Label>
            <span>{copy.price.member.roadmapBody}</span>
          </span>
        </li>
      </ul>
      <div className="l-plan-actions">
        <span className="l-plan-foot">{copy.price.member.footnote}</span>
        <AccountCta label={copy.price.member.cta} />
      </div>
    </Reveal>
  );
}

export function PricePanel(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <div id="price" className="l-price">
      <div className="l-price-panel">
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 18 }}
        >
          <Reveal>
            <Label on="light" style={{ color: "var(--text-on-light)" }}>
              {copy.price.eyebrow}
            </Label>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="l-price-title">{copy.price.title}</h2>
          </Reveal>
          <Reveal delay={160}>
            <p
              style={{
                margin: 0,
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--text-on-light-secondary)",
                maxWidth: 560,
                textWrap: "pretty",
              }}
            >
              {copy.price.lead}
            </p>
          </Reveal>
        </div>

        <div className="l-ledger">
          <FreePlan />
          <MemberPlan />
        </div>
      </div>
    </div>
  );
}

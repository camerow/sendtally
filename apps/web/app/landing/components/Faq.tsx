import React from "react";
import { useLanding } from "../LandingContext";

export function Faq(): React.ReactElement {
  const { copy } = useLanding();
  const { faq } = copy.pricing;
  return (
    <section className="l-faq">
      <h2 className="l-pricing-h2">{faq.title}</h2>
      <dl className="l-faq-list">
        {faq.items.map((item) => (
          <div key={item.q} className="l-faq-item">
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

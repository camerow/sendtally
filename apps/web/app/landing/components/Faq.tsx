import React from "react";

export type FaqProps = {
  title: string;
  items: Array<{ q: string; a: string; link?: { label: string; href: string } }>;
};

export function Faq({ title, items }: FaqProps): React.ReactElement {
  return (
    <section className="l-faq">
      <h2 className="l-pricing-h2">{title}</h2>
      <dl className="l-faq-list">
        {items.map((item) => (
          <div key={item.q} className="l-faq-item">
            <dt>{item.q}</dt>
            <dd>
              {item.a}
              {item.link !== undefined && (
                <>
                  {" "}
                  <a href={item.link.href} className="l-textlink l-textlink--plain">
                    {item.link.label}
                  </a>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

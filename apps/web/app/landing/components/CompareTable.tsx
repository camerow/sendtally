import React from "react";
import { useLanding } from "../LandingContext";
import type { CompareCell } from "../copy";

function Cell({ value }: { value: CompareCell }): React.ReactElement {
  const { copy } = useLanding();
  if (value === true)
    return (
      <span className="l-compare-cell">
        <span className="l-tick" role="img" aria-label={copy.pricing.compare.included} />
      </span>
    );
  if (value === false)
    return (
      <span
        className="l-compare-cell l-compare-cell--none"
        role="img"
        aria-label={copy.pricing.compare.notIncluded}
      >
        <span className="l-compare-dash" aria-hidden="true" />
      </span>
    );
  return <span className="l-compare-cell">{value}</span>;
}

export function CompareTable(): React.ReactElement {
  const { copy } = useLanding();
  const { compare } = copy.pricing;
  return (
    <section className="l-compare">
      <div className="l-compare-inner">
        <h2 className="l-pricing-h2">{compare.title}</h2>
        <div className="l-compare-table" role="table">
          <div className="l-compare-row l-compare-row--head" role="row">
            <span role="columnheader" />
            {compare.columns.map((c) => (
              <span key={c} className="l-compare-cell" role="columnheader">
                {c}
              </span>
            ))}
          </div>
          {compare.rows.map((row) => (
            <div key={row.label} className="l-compare-row" role="row">
              <span role="rowheader">{row.label}</span>
              <Cell value={row.free} />
              <Cell value={row.member} />
            </div>
          ))}
        </div>
        <p className="l-compare-note">{compare.note}</p>
      </div>
    </section>
  );
}

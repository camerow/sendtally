import React from "react";
import { COPY } from "../copy";

function DetailRow({
  label,
  body,
  last,
}: {
  label: string;
  body: string;
  last: boolean;
}): React.ReactElement {
  return (
    <div
      className="l-detail-row"
      style={{ borderBottom: last ? "1px solid var(--line-on-light)" : "none" }}
    >
      <span
        style={{
          width: 150,
          flex: "none",
          paddingTop: 2,
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
          fontSize: 11,
          letterSpacing: "var(--type-label-track)",
          color: "var(--text-label-accent)",
        }}
      >
        {label}
      </span>
      <span className="l-detail-body">{body}</span>
    </div>
  );
}

export function Details(): React.ReactElement {
  return (
    <div id="details" className="l-details">
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <h2 className="l-section-title" style={{ color: "var(--bs-gunmetal)" }}>
          {COPY.details.title}
        </h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {COPY.details.rows.map((row, i) => (
            <DetailRow
              key={row.label}
              label={row.label}
              body={row.body}
              last={i === COPY.details.rows.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router";
import { Icon } from "./Icon";

const style: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--bs-gunmetal)",
  textDecoration: "none",
  alignSelf: "flex-start",
};

/** Back as every page draws it: a chevron and a gunmetal mono label, to a route or a step back. */
export function BackLink({
  children,
  ...target
}: { children: React.ReactNode } & (
  { to: string; onClick?: undefined } | { onClick: () => void; to?: undefined }
)): React.ReactElement {
  const content = (
    <>
      <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
        <Icon name="chevron" size={14} strokeWidth={2.2} />
      </span>
      {children}
    </>
  );
  if (target.to !== undefined)
    return (
      <Link to={target.to} style={style}>
        {content}
      </Link>
    );
  return (
    <button type="button" onClick={target.onClick} style={style}>
      {content}
    </button>
  );
}

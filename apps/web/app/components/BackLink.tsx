import React from "react";
import { Link } from "react-router";

export const backLinkStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--text-label-accent)",
  textDecoration: "none",
  alignSelf: "flex-start",
};

export function BackLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link to={to} style={backLinkStyle}>
      ← {children}
    </Link>
  );
}

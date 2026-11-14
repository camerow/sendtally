import React from "react";
import { Label } from "@sendtally/design";

export type PageHeaderProps = {
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  body,
  children,
}: PageHeaderProps): React.ReactElement {
  return (
    <header id="top" className="l-pricing-head">
      <Label on="accent">{eyebrow}</Label>
      <h1 className="l-pricing-title">{title}</h1>
      <p className="l-pricing-body">{body}</p>
      {children}
    </header>
  );
}

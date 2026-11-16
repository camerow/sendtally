import React from "react";
import { Link } from "react-router";
import { Icon } from "./Icon";

export type BackLinkProps = {
  children: React.ReactNode;
} & ({ to: string; onClick?: undefined } | { onClick: () => void; to?: undefined });

/** Back as every page draws it: a chevron and a gunmetal mono label, to a route or a step back. */
export function BackLink({ children, ...target }: BackLinkProps): React.ReactElement {
  const content = (
    <>
      <span className="detail-back-chevron">
        <Icon name="chevron" size={14} strokeWidth={2.2} />
      </span>
      {children}
    </>
  );
  if (target.to !== undefined)
    return (
      <Link to={target.to} className="detail-back">
        {content}
      </Link>
    );
  return (
    <button type="button" onClick={target.onClick} className="detail-back">
      {content}
    </button>
  );
}

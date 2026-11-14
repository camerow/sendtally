import React from "react";
import { Link } from "react-router";
import { Icon } from "../../components/Icon";

export type PlanCardProps = {
  title: string;
  /** Under the title: a block's dates, or what the plans in no block do. */
  subtitle?: string;
  /** Makes the title a link. */
  open?: { label: string; to: string };
  children: React.ReactNode;
};

/** A framed set of plans under a title: a block, or the plans in no block. */
export function PlanCard({ title, subtitle, open, children }: PlanCardProps): React.ReactElement {
  const head = (
    <span className="group-card-text">
      <span className="train-title group-card-title">{title}</span>
      {subtitle !== undefined && <span className="block-when">{subtitle}</span>}
    </span>
  );
  return (
    <div className="group-card">
      {open === undefined ? (
        <div className="group-card-head">{head}</div>
      ) : (
        <Link
          to={open.to}
          className="group-card-head group-card-head--link"
          aria-label={open.label}
        >
          {head}
          <Icon name="chevron" size={14} strokeWidth={2} />
        </Link>
      )}
      {children}
    </div>
  );
}

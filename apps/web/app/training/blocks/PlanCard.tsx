import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { Lock } from "../../components/Lock";

export type PlanCardProps = {
  title: string;
  /** Under the title: a block's dates, or what the plans in no block do. */
  subtitle?: string;
  /** Makes the title a link. */
  open?: { label: string; to: string };
  /** Members only: the title muted and the lock in place of the chevron. */
  locked?: boolean;
  /** A ··· beside the title, such as a locked card's Delete. */
  menu?: React.ReactNode;
  children: React.ReactNode;
};

/** A framed set of plans under a title: a block, or the plans in no block. */
export function PlanCard({
  title,
  subtitle,
  open,
  locked = false,
  menu,
  children,
}: PlanCardProps): React.ReactElement {
  const head = (
    <span className="group-card-text">
      <span className="train-title group-card-title">{title}</span>
      {subtitle !== undefined && <span className="block-when">{subtitle}</span>}
    </span>
  );
  const link = open !== undefined && (
    <Link
      to={open.to}
      className={
        locked
          ? "group-card-head group-card-head--link group-card-head--locked"
          : "group-card-head group-card-head--link"
      }
      aria-label={locked ? t("common.membersOnly", { label: title }) : open.label}
    >
      {head}
      {locked ? <Lock /> : <Icon name="chevron" size={14} strokeWidth={2} />}
    </Link>
  );
  return (
    <div className="group-card">
      {link === false ? (
        <div className="group-card-head">{head}</div>
      ) : menu === undefined ? (
        link
      ) : (
        <div className="locked-row">
          {link}
          {menu}
        </div>
      )}
      {children}
    </div>
  );
}

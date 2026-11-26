import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { Lock } from "../../components/Lock";
import { blockPath } from "./paths";
import { LockedRow } from "../components/LockedRow";

export type BlockRowProps = {
  id: string;
  name: string;
  meta?: string;
  /** In place of opening the block, such as picking it to schedule. */
  onPress?: () => void;
  /** Where it goes in place of the block, such as the Membership page. */
  to?: string;
  /** Members only: the name muted and the lock in place of the chevron. */
  locked?: boolean;
  /** A ··· beside the row, such as a locked row's Delete. */
  menu?: React.ReactNode;
};

/** A block in a list: its name and when, opening the block. */
export function BlockRow({
  id,
  name,
  meta,
  onPress,
  to = blockPath(id),
  locked = false,
  menu,
}: BlockRowProps): React.ReactElement {
  const body = (
    <>
      <span className="block-row-text">
        <span className="block-row-name">{name}</span>
        {meta !== undefined && <span className="block-row-meta">{meta}</span>}
      </span>
      {locked ? <Lock /> : <Icon name="forward" size={16} strokeWidth={2.2} />}
    </>
  );
  const label = locked ? t("common.membersOnly", { label: name }) : t("plan.openBlock", { name });
  const className = locked ? "block-row block-row--locked" : "block-row";
  const row =
    onPress === undefined ? (
      <Link to={to} className={className} aria-label={label}>
        {body}
      </Link>
    ) : (
      <button type="button" className={className} aria-label={label} onClick={onPress}>
        {body}
      </button>
    );
  return <LockedRow menu={menu}>{row}</LockedRow>;
}

import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { blockPath } from "./paths";

export type BlockRowProps = {
  id: string;
  name: string;
  meta?: string;
  /** In place of opening the block, such as picking it to schedule. */
  onPress?: () => void;
};

/** A block in a list: its name and when, opening the block. */
export function BlockRow({ id, name, meta, onPress }: BlockRowProps): React.ReactElement {
  const body = (
    <>
      <span className="block-row-text">
        <span className="block-row-name">{name}</span>
        {meta !== undefined && <span className="block-row-meta">{meta}</span>}
      </span>
      <Icon name="forward" size={16} strokeWidth={2.2} />
    </>
  );
  const label = t("plan.openBlock", { name });
  return onPress === undefined ? (
    <Link to={blockPath(id)} className="block-row" aria-label={label}>
      {body}
    </Link>
  ) : (
    <button type="button" className="block-row" aria-label={label} onClick={onPress}>
      {body}
    </button>
  );
}

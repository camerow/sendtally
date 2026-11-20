import React from "react";
import { Link } from "react-router";
import type { EntryKind } from "@sendtally/features/journal";
import { Icon, type IconName } from "../../components/Icon";
import { EntryKindIcon } from "../../journal/components/EntryKindIcon";

export type MenuRowProps = {
  icon: IconName | EntryKind;
  title: string;
  hint?: string;
  /** Where it goes; `onPress` instead runs an action here. */
  to?: string;
  onPress?: () => void;
  /** Leaves the app: an arrow out in place of the chevron. */
  external?: boolean;
};

/** A way in: a round icon, its title and a hint, and a chevron. */
export function MenuRow({
  icon,
  title,
  hint,
  to,
  onPress,
  external = false,
}: MenuRowProps): React.ReactElement {
  const body = (
    <>
      <span className="menu-row-icon">
        {icon === "journal" || icon === "trip" || icon === "injury" ? (
          <EntryKindIcon kind={icon} />
        ) : (
          <Icon name={icon} size={20} strokeWidth={2} />
        )}
      </span>
      <span className="menu-row-text">
        <span className="menu-row-title">{title}</span>
        {hint !== undefined && <span className="menu-row-hint">{hint}</span>}
      </span>
      <span className="log-row-chevron">
        <Icon name={external ? "external" : "chevron"} size={external ? 14 : 12} strokeWidth={2} />
      </span>
    </>
  );
  return to === undefined ? (
    <button type="button" className="menu-row" onClick={onPress}>
      {body}
    </button>
  ) : (
    <Link to={to} className="menu-row" onClick={onPress}>
      {body}
    </Link>
  );
}

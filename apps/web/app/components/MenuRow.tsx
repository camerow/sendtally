import React from "react";
import { Link } from "react-router";
import type { EntryKind } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { Icon, type IconName } from "./Icon";
import { Lock } from "./Lock";
import { EntryKindIcon } from "../journal/components/EntryKindIcon";

export type MenuRowProps = {
  icon: IconName | EntryKind;
  title: string;
  hint?: string;
  /** Where it goes; `onPress` instead runs an action here. */
  to?: string;
  onPress?: () => void;
  /** Leaves the app: an arrow out in place of the chevron. */
  external?: boolean;
  /** Members only: muted, with the lock in place of the chevron. */
  locked?: boolean;
};

/** A way in: a round icon, its title and a hint, and a chevron. */
export function MenuRow({
  icon,
  title,
  hint,
  to,
  onPress,
  external = false,
  locked = false,
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
      {locked ? (
        <Lock />
      ) : (
        <span className="menu-row-chevron">
          <Icon
            name={external ? "external" : "chevron"}
            size={external ? 14 : 12}
            strokeWidth={2}
          />
        </span>
      )}
    </>
  );
  const props = {
    className: locked ? "menu-row menu-row--locked" : "menu-row",
    "aria-label": locked ? t("common.membersOnly", { label: title }) : undefined,
    onClick: onPress,
  };
  return to === undefined ? (
    <button type="button" {...props}>
      {body}
    </button>
  ) : (
    <Link to={to} {...props}>
      {body}
    </Link>
  );
}

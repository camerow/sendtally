import { useUser } from "@clerk/react-router";
import React from "react";
import { Link, useLocation } from "react-router";
import { t } from "@sendtally/features/i18n";

/** Profile and the pages it opens. */
const PROFILE = ["/app/settings", "/app/account", "/app/membership", "/app/import"];

/**
 * The way to Profile: the avatar alone at the right of a tab's header at 375, or with the
 * first name at the foot of the desktop sidebar.
 */
export function AccountButton({ withName = false }: { withName?: boolean }): React.ReactElement {
  const { user } = useUser();
  const name = user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const { pathname } = useLocation();
  const here = PROFILE.some((path) => pathname.startsWith(path));
  return (
    <Link
      to="/app/settings"
      aria-current={here ? "page" : undefined}
      aria-label={withName ? undefined : t("training.account")}
      className={withName ? "account-link" : "account-button"}
    >
      <span className="account-avatar" aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
      {withName && <span className="account-name">{name}</span>}
    </Link>
  );
}

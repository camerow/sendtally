import { useAuth } from "@clerk/react-router";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { NavLink, Outlet, useLocation, useRouteError } from "react-router";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { ErrorPage } from "../components/ErrorPage";
import { Icon, type IconName } from "../components/Icon";
import { requireApi } from "../lib/api.server";
import { cloudflareContext } from "../lib/cloudflare-context";
import { AccountButton } from "../components/AccountButton";
import { ToastProvider } from "../components/Toast";
import { useAppApi } from "../lib/useAppApi";
import { useIsModerator } from "../lib/useIsModerator";
import { WebOutboxProvider } from "../lib/WebOutboxProvider";
import { GradeScalesProvider } from "@sendtally/features/settings";
import appShellStyles from "../styles/app-shell.css?url";
import { pageMeta } from "../lib/seo";
import { useReportGoogleSignUp } from "../auth/useReportGoogleSignUp";

export function meta(): Array<Record<string, string>> {
  return pageMeta({ title: "sendtally", path: "/app", noindex: true });
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: appShellStyles }];

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

type NavItem = { label: () => string; to: string; icon: IconName };

const NAV_ITEMS: NavItem[] = [
  { label: () => t("journal.log"), to: "/app", icon: "sessions" },
  { label: () => t("common.projects"), to: "/app/projects", icon: "projects" },
  { label: () => t("common.trends"), to: "/app/trends", icon: "trends" },
];

const MODERATION_ITEM: NavItem = {
  label: () => "Moderation",
  to: "/app/moderation",
  icon: "moderation",
};

/** Screens reached by a back link, whose own action bar owns the bottom edge. */
const FOCUSED_ROUTES = ["/app/sessions/new"];

function Shell({ children }: { children: React.ReactNode }): React.ReactElement {
  const { pathname } = useLocation();
  const focused = FOCUSED_ROUTES.includes(pathname);
  const moderator = useIsModerator();
  useReportGoogleSignUp();

  return (
    <div className="app-shell">
      <div className="app-sidebar">
        <a href="/" className="app-logo-link">
          <Logo tone="on-light" size={24} />
        </a>
        {(moderator ? [...NAV_ITEMS, MODERATION_ITEM] : NAV_ITEMS).map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 500,
              fontSize: 14,
              textAlign: "left",
              background: isActive ? "rgba(64,63,76,0.08)" : "none",
              color: isActive ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
              borderRadius: "var(--radius-control)",
              padding: "10px 12px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flex: "none",
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ display: "flex", color: isActive ? "var(--bs-gold)" : "inherit" }}>
                  <Icon name={icon} strokeWidth={isActive ? 2.3 : 1.7} />
                </span>
                {label()}
              </>
            )}
          </NavLink>
        ))}
        <div className="app-sidebar-spacer" />
        <div className="app-sidebar-footer">
          <AccountButton withName />
        </div>
      </div>
      <div className={focused ? "app-content app-content--focused" : "app-content"}>{children}</div>
      {!focused && (
        <nav className="app-tabbar" aria-label={t("common.sectionsAria")}>
          {NAV_ITEMS.map(({ label, to, icon }) => (
            <NavLink key={to} to={to} end className="app-tab">
              <Icon name={icon} />
              {label()}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function AppLayout(): React.ReactElement {
  const api = useAppApi();
  const { userId } = useAuth();
  return (
    <GradeScalesProvider api={api}>
      <ToastProvider>
        <WebOutboxProvider api={api} userId={userId ?? ""}>
          <Shell>
            <Outlet />
          </Shell>
        </WebOutboxProvider>
      </ToastProvider>
    </GradeScalesProvider>
  );
}

export function ErrorBoundary(): React.ReactElement {
  const error = useRouteError();
  return (
    <Shell>
      <ErrorPage error={error} />
    </Shell>
  );
}

import { useAuth, useUser } from "@clerk/react-router";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs, ShouldRevalidateFunction } from "react-router";
import { NavLink, Outlet, redirect, useLocation, useRouteError } from "react-router";
import { Logo } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { ErrorPage } from "../components/ErrorPage";
import { Icon, type IconName } from "../components/Icon";
import { requireApi } from "../lib/api.server";
import { firstRunDue, firstRunGate, fromFirstRun } from "../first-run/firstRunGate";
import { cloudflareContext } from "../lib/cloudflare-context";
import { AccountButton } from "../components/AccountButton";
import { LiveBar } from "../components/LiveBar";
import { AlreadyRunningSheet } from "../live-session/components/AlreadyRunningSheet";
import { LIVE_PATH } from "../live-session/startLive";
import { useLiveSessionStorage } from "../lib/useLiveSessionStorage";
import { useLiveRunStore } from "../lib/useLiveRun";
import { useLiveRun } from "@sendtally/features/workouts";
import { LiveRunTones } from "../components/LiveRunTones";
import { useLiveSession } from "@sendtally/features/log-session";
import { ToastProvider } from "../components/Toast";
import { useAppApi } from "../lib/useAppApi";
import { useIsModerator } from "../lib/useIsModerator";
import { WebOutboxProvider } from "../lib/WebOutboxProvider";
import { LibraryProvider } from "@sendtally/features/library";
import { GradeScalesProvider } from "@sendtally/features/settings";
import appShellStyles from "../styles/app-shell.css?url";
import { pageMeta } from "../lib/seo";
import { useReportGoogleSignUp } from "../auth/useReportGoogleSignUp";

export function meta(): Array<Record<string, string>> {
  return pageMeta({ title: "sendtally", path: "/app", noindex: true });
}

export const links: LinksFunction = () => [{ rel: "stylesheet", href: appShellStyles }];

/**
 * First run shows once, before anything else under /app but its import, and only to an account
 * the server says has not had it; /app/start sends anyone else on. Checked on a full load only,
 * so moving around the app, or between first run and its import, never asks again.
 */
export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  const api = await requireApi(args);
  const due = await firstRunDue(() => api.status());
  const to = firstRunGate(new URL(args.request.url).pathname, due);
  if (to !== null) throw redirect(to);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

type NavItem = { label: () => string; to: string; icon: IconName };

const NAV_ITEMS: NavItem[] = [
  { label: () => t("journal.log"), to: "/app", icon: "sessions" },
  { label: () => t("plan.tab"), to: "/app/plan", icon: "today" },
  { label: () => t("training.train"), to: "/app/train", icon: "train" },
  { label: () => t("statistics.tab"), to: "/app/stats", icon: "insights" },
];

const MODERATION_ITEM: NavItem = {
  label: () => "Moderation",
  to: "/app/moderation",
  icon: "moderation",
};

/** Screens reached by a back link, whose own action bar owns the bottom edge. */
const FOCUSED_ROUTES = [
  "/app/sessions/new",
  "/app/log/climbs/new",
  "/app/sessions/live",
  "/app/workout/sets",
  "/app/workout/checklist",
  "/app/workout/timer",
  "/app/workout/intervals",
];

/** Pages that are the live thing itself, where the live bar would only point back at them; so is a live run's review. */
const LIVE_ROUTES = [
  LIVE_PATH,
  "/app/workout/sets",
  "/app/workout/checklist",
  "/app/workout/timer",
  "/app/workout/intervals",
];

function Shell({ children }: { children: React.ReactNode }): React.ReactElement {
  const { pathname, search } = useLocation();
  const focused = FOCUSED_ROUTES.includes(pathname);
  const onLive =
    LIVE_ROUTES.includes(pathname) ||
    (pathname === "/app/activity/new" && new URLSearchParams(search).get("live") === "1") ||
    (pathname === "/app/workout/done" && new URLSearchParams(search).has("run"));
  const session = useLiveSession(useLiveSessionStorage()).stored;
  const run = useLiveRun(useLiveRunStore());
  const live = session !== null || run !== null;
  const moderator = useIsModerator();
  useReportGoogleSignUp(useUser().user);

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
            end={to === "/app"}
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
        {!onLive && <LiveBar />}
        <div className="app-sidebar-footer">
          <AccountButton withName />
        </div>
      </div>
      <div
        className={
          focused
            ? "app-content app-content--focused"
            : live && !onLive
              ? "app-content app-content--live"
              : "app-content"
        }
      >
        {children}
      </div>
      {!focused && (
        <div className="app-bottom">
          {!onLive && <LiveBar />}
          <nav className="app-tabbar" aria-label={t("common.sectionsAria")}>
            {NAV_ITEMS.map(({ label, to, icon }) => (
              <NavLink key={to} to={to} end={to === "/app"} className="app-tab">
                <Icon name={icon} />
                {label()}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
      <AlreadyRunningSheet />
      <LiveRunTones />
    </div>
  );
}

export default function AppLayout(): React.ReactElement {
  const api = useAppApi();
  const { userId } = useAuth();
  const { pathname, search } = useLocation();
  // First run and the import it opens draw their own frame, as the phone's are full screens.
  const bare = pathname === "/app/start" || (pathname === "/app/import" && fromFirstRun(search));
  return (
    <GradeScalesProvider api={api}>
      <LibraryProvider api={api}>
        <ToastProvider>
          <WebOutboxProvider api={api} userId={userId ?? ""}>
            {bare ? (
              <Outlet />
            ) : (
              <Shell>
                <Outlet />
              </Shell>
            )}
          </WebOutboxProvider>
        </ToastProvider>
      </LibraryProvider>
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

import { useClerk, useUser } from "@clerk/react-router";
import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Logo } from "@sendtally/design";
import { NavIcon, type NavIconName } from "../components/NavIcon";
import { requireApi } from "../lib/api.server";
import appShellStyles from "../styles/app-shell.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: appShellStyles }];

export async function loader(args: LoaderFunctionArgs): Promise<null> {
  await requireApi(args);
  return null;
}

type NavItem = { label: string; to: string; icon: NavIconName };

const NAV_ITEMS: NavItem[] = [
  { label: "Sessions", to: "/app", icon: "sessions" },
  { label: "Trends", to: "/app/trends", icon: "trends" },
  { label: "Settings", to: "/app/settings", icon: "settings" },
  { label: "Membership", to: "/app/membership", icon: "membership" },
];

/** Screens reached by a back link, whose own action bar owns the bottom edge. */
const FOCUSED_ROUTES = ["/app/sessions/new"];

export default function AppLayout(): React.ReactElement {
  const clerk = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const focused = FOCUSED_ROUTES.includes(pathname);

  const signOut = (
    <button onClick={() => void clerk.signOut(() => navigate("/"))} className="app-sign-out">
      Sign out
    </button>
  );

  return (
    <div className="app-shell">
      <div className="app-sidebar">
        <a href="/" className="app-logo-link">
          <Logo tone="on-light" size={24} />
        </a>
        {NAV_ITEMS.map(({ label, to }) => (
          <NavLink
            key={label}
            to={to}
            end
            style={({ isActive }) => ({
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
            {label}
          </NavLink>
        ))}
        <div className="app-sidebar-spacer" />
        <div className="app-sidebar-footer">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "rgba(64,63,76,0.55)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email}
          </span>
          {signOut}
        </div>
      </div>
      <header className="app-topbar">
        <a href="/" style={{ display: "inline-flex", textDecoration: "none" }}>
          <Logo tone="on-light" size={24} />
        </a>
        {signOut}
      </header>
      <div className={focused ? "app-content app-content--focused" : "app-content"}>
        <Outlet />
      </div>
      {!focused && (
        <nav className="app-tabbar" aria-label="Sections">
          {NAV_ITEMS.map(({ label, to, icon }) => (
            <NavLink key={label} to={to} end className="app-tab">
              <NavIcon name={icon} />
              {label.toUpperCase()}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

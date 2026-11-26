import React from "react";
import { Link } from "react-router";
import { Logo } from "@sendtally/design";
import { useModerator } from "../../lib/useIsModerator";

export type AdminFrameProps = {
  title: string;
  /** Where its back link goes, with the label it reads; the admin root has none. */
  back?: { to: string; label: string };
  /** Shown beside the title, such as a page's New buttons. */
  actions?: React.ReactNode;
  /** Mounted only for a moderator, so a page asks for nothing on anyone else's behalf. */
  children: React.ReactNode;
};

/** An admin page's head, and its body only for moderators. */
export function AdminFrame({
  title,
  back,
  actions,
  children,
}: AdminFrameProps): React.ReactElement {
  const moderator = useModerator();
  return (
    <div className="mod-page">
      {back !== undefined && (
        <Link to={back.to} className="mod-lib-back">
          {`‹ ${back.label}`}
        </Link>
      )}
      <div className="sessions-head admin-head">
        <span className="sessions-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="sessions-title">{title}</h1>
        {moderator === true && actions !== undefined && (
          <div className="mod-actions admin-head-actions">{actions}</div>
        )}
      </div>
      {moderator === null && <span className="area-meta">Loading…</span>}
      {moderator === false && (
        <div className="mod-card admin-gate">
          <h2 className="mod-title">Moderators only</h2>
          <p className="mod-muted">This page is for sendtally moderators.</p>
        </div>
      )}
      {moderator === true && children}
    </div>
  );
}

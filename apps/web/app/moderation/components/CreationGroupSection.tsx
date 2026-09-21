import React from "react";
import { Link } from "react-router";
import { Button } from "@sendtally/design";
import type { CreationGroup } from "@sendtally/features/areas";
import { PendingBadge } from "../../areas/components/PendingBadge";

export type CreationGroupSectionProps = {
  group: CreationGroup;
  selectedCount: number;
  collapsed: boolean;
  busy: boolean;
  onToggleAll: () => void;
  onToggleCollapsed: () => void;
  onApproveAll: () => void;
  children: React.ReactNode;
};

/** One area's pending work: select it, fold it, or approve the whole subtree at once. */
export function CreationGroupSection({
  group,
  selectedCount,
  collapsed,
  busy,
  onToggleAll,
  onToggleCollapsed,
  onApproveAll,
  children,
}: CreationGroupSectionProps): React.ReactElement {
  const name = group.area?.name ?? "Unknown area";
  const total = group.rows.length;
  return (
    <section className="mod-group">
      <div className="mod-group-head">
        <input
          type="checkbox"
          className="mod-check"
          aria-label={`Select everything in ${name}`}
          checked={selectedCount === total}
          ref={(el) => {
            if (el !== null) el.indeterminate = selectedCount > 0 && selectedCount < total;
          }}
          onChange={onToggleAll}
        />
        <button
          type="button"
          className="mod-fold"
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "Expand" : "Collapse"} ${name}`}
          onClick={onToggleCollapsed}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <h2 className="mod-group-title">
          {group.trail.length > 0 && (
            <span className="mod-group-trail">
              {group.trail.map((step) => step.name).join(" / ")} /
            </span>
          )}
          {group.area === null ? name : <Link to={`/app/areas/${group.area.slug}`}>{name}</Link>}
          {group.area?.status === "pending" && <PendingBadge />}
        </h2>
        <span className="mod-group-count">
          {selectedCount > 0 ? `${total} pending · ${selectedCount} selected` : `${total} pending`}
        </span>
        <Button variant="ghostOnLight" size="sm" disabled={busy} onClick={onApproveAll}>
          {total === 1 ? "Approve" : `Approve all ${total}`}
        </Button>
      </div>
      {!collapsed && children}
    </section>
  );
}

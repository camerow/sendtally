import React from "react";
import { Link } from "react-router";
import { Button } from "@sendtally/design";
import type { CreationItem } from "@sendtally/api-client";
import {
  areaClimbGradeLabel,
  climbTypeLabel,
  creationEntity,
  queuedOn,
  submitterRecord,
  type CreationRow as Row,
} from "@sendtally/features/areas";
import { formatNumber } from "@sendtally/features/i18n";

const coordinate = (n: number): string => formatNumber(n, { maximumFractionDigits: 4 });

function factsOf(item: CreationItem): string {
  if (item.entity_type === "climb") {
    return `${climbTypeLabel(item.climb.type)} · ${areaClimbGradeLabel(item.climb)}`;
  }
  return item.area.lat !== null && item.area.lon !== null
    ? `${coordinate(item.area.lat)}, ${coordinate(item.area.lon)}`
    : "No coordinates";
}

export type CreationRowProps = {
  row: Row;
  selected: boolean;
  current: boolean;
  busy: boolean;
  onSelect: (id: string, range: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMove: (id: string) => void;
  onMergeInto: (id: string, keepId: string) => void;
};

export function CreationRow({
  row,
  selected,
  current,
  busy,
  onSelect,
  onApprove,
  onReject,
  onMove,
  onMergeInto,
}: CreationRowProps): React.ReactElement {
  const { item, id, level } = row;
  const entity = creationEntity(item);
  const isArea = item.entity_type === "area";
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (current) ref.current?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <div
      ref={ref}
      className="mod-row"
      data-kind={item.entity_type}
      data-selected={selected}
      data-current={current}
    >
      <input
        type="checkbox"
        className="mod-check"
        aria-label={`Select ${entity.name}`}
        checked={selected}
        onChange={(e) => onSelect(id, (e.nativeEvent as MouseEvent).shiftKey === true)}
      />
      <div
        className="mod-row-name"
        data-nested={level > 0}
        style={{ "--mod-level": level } as React.CSSProperties}
      >
        <div className="mod-row-title">
          <span className="mod-kind" data-kind={item.entity_type}>
            {isArea ? "New area" : "Climb"}
          </span>
          <Link to={isArea ? `/app/areas/${item.area.slug}` : `/app/climbs/${item.climb.slug}`}>
            {entity.name}
          </Link>
        </div>
        {entity.description !== null && <span className="mod-row-desc">{entity.description}</span>}
      </div>
      <span className="mod-row-facts">{factsOf(item)}</span>
      <div className="mod-row-submitter">
        {item.submitter === null ? (
          <span className="mod-muted">Deleted account</span>
        ) : (
          <>
            <span>{item.submitter.name ?? "Unnamed"}</span>
            <span className="mod-row-record">{submitterRecord(item.submitter)}</span>
          </>
        )}
      </div>
      <span className="mod-row-facts mod-row-queued">{queuedOn(item.created_at)}</span>
      <div className="mod-row-duplicates">
        {item.candidates.length === 0 && <span className="mod-muted">None found</span>}
        {item.candidates.map((candidate) => (
          <span key={candidate.id} className="mod-duplicate">
            <Link to={isArea ? `/app/areas/${candidate.slug}` : `/app/climbs/${candidate.slug}`}>
              {candidate.name}
            </Link>
            {!isArea && (
              <button type="button" disabled={busy} onClick={() => onMergeInto(id, candidate.id)}>
                Merge into
              </button>
            )}
          </span>
        ))}
      </div>
      <div className="mod-row-actions">
        <button
          type="button"
          className="mod-icon-button"
          aria-label={`Move ${entity.name} under another area`}
          title="Move under…"
          onClick={() => onMove(id)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-3H5a2 2 0 0 0-2 2z" />
            <path d="M9 14h6" />
            <path d="M13 11l3 3-3 3" />
          </svg>
        </button>
        <Button variant="ghostOnLight" size="sm" onClick={() => onReject(id)}>
          Reject
        </Button>
        <Button variant="azure" size="sm" disabled={busy} onClick={() => onApprove(id)}>
          Approve
        </Button>
      </div>
    </div>
  );
}

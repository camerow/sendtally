import React from "react";

export type BulkBarProps = {
  areas: number;
  climbs: number;
  flagged: number;
  busy: boolean;
  onClear: () => void;
  onMove: () => void;
  onReject: () => void;
  onApprove: () => void;
};

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** What the selection holds and the three things that can happen to all of it. */
export function BulkBar({
  areas,
  climbs,
  flagged,
  busy,
  onClear,
  onMove,
  onReject,
  onApprove,
}: BulkBarProps): React.ReactElement {
  const total = areas + climbs;
  return (
    <div className="mod-bulk" role="region" aria-label="Selection">
      <span className="mod-bulk-count">{total} selected</span>
      <span className="mod-bulk-breakdown">
        {plural(areas, "area", "areas")} · {plural(climbs, "climb", "climbs")}
      </span>
      {flagged > 0 && (
        <span className="mod-bulk-flag">
          {plural(flagged, "possible duplicate", "possible duplicates")}
        </span>
      )}
      <span className="mod-bulk-gap" />
      <button type="button" className="mod-bulk-button" onClick={onClear}>
        Clear
      </button>
      <button type="button" className="mod-bulk-button" data-outline onClick={onMove}>
        Move under…
      </button>
      <button type="button" className="mod-bulk-button" data-outline onClick={onReject}>
        Reject with note
      </button>
      <button
        type="button"
        className="mod-bulk-button"
        data-primary
        disabled={busy}
        onClick={onApprove}
      >
        Approve {total}
      </button>
    </div>
  );
}

import React from "react";
import { Link } from "react-router";
import { Button } from "@sendtally/design";
import type { CreationItem, SendtallyApi } from "@sendtally/api-client";
import {
  areaClimbGradeLabel,
  climbTypeLabel,
  queuedOn,
  useModerationAction,
} from "@sendtally/features/areas";
import { formatNumber } from "@sendtally/features/i18n";
import { ModCard } from "./ModCard";
import { NoteDialog } from "./NoteDialog";

const coordinate = (n: number): string => formatNumber(n, { maximumFractionDigits: 4 });

export function CreationCard({
  api,
  item,
}: {
  api: SendtallyApi;
  item: CreationItem;
}): React.ReactElement {
  const { busy, error, run } = useModerationAction();
  const [rejecting, setRejecting] = React.useState(false);
  const entity = item.entity_type === "area" ? item.area : item.climb;
  const href =
    item.entity_type === "area" ? `/app/areas/${entity.slug}` : `/app/climbs/${entity.slug}`;
  const facts =
    item.entity_type === "area"
      ? item.area.lat !== null && item.area.lon !== null
        ? `${coordinate(item.area.lat)}, ${coordinate(item.area.lon)}`
        : null
      : `${climbTypeLabel(item.climb.type)} · ${areaClimbGradeLabel(item.climb)}`;

  return (
    <ModCard
      kicker={`${item.entity_type === "area" ? "New area" : "New climb"} · ${queuedOn(item.created_at)}`}
      error={rejecting ? null : error}
      actions={
        <>
          <Button variant="ghostOnLight" size="sm" onClick={() => setRejecting(true)}>
            Reject
          </Button>
          <Button
            variant="azure"
            size="sm"
            disabled={busy}
            onClick={() =>
              void run(() => api.approveCreation(item.entity_type, entity.id, entity.version))
            }
          >
            Approve
          </Button>
        </>
      }
    >
      <div className="mod-title-row">
        <Link to={href} className="mod-title">
          {entity.name}
        </Link>
        {facts !== null && <span className="area-meta">{facts}</span>}
      </div>
      {entity.description !== null && <p className="mod-quote">{entity.description}</p>}
      <div className="mod-lookalikes">
        <span className="mod-label">Look-alikes</span>
        {item.candidates.length === 0 && <span className="mod-muted">No look-alikes found.</span>}
        {item.candidates.map((candidate) => (
          <div key={candidate.id} className="mod-lookalike">
            <Link
              to={
                item.entity_type === "area"
                  ? `/app/areas/${candidate.slug}`
                  : `/app/climbs/${candidate.slug}`
              }
            >
              {candidate.name}
            </Link>
            {item.entity_type === "climb" && (
              <Button
                variant="ghostOnLight"
                size="sm"
                disabled={busy}
                onClick={() => void run(() => api.mergeClimbInto(entity.id, candidate.id))}
              >
                Merge into this
              </Button>
            )}
          </div>
        ))}
      </div>
      {rejecting && (
        <NoteDialog
          title={`Reject ${entity.name}?`}
          submitLabel="Reject"
          busy={busy}
          error={error}
          onClose={() => setRejecting(false)}
          onSubmit={(note) =>
            void run(
              async () => {
                await api.rejectCreation(item.entity_type, entity.id, note);
                setRejecting(false);
              },
              item.entity_type === "area" ? "Reject or approve what is inside it first." : undefined
            )
          }
        />
      )}
    </ModCard>
  );
}

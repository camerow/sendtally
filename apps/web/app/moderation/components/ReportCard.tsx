import React from "react";
import { Link } from "react-router";
import { Button } from "@sendtally/design";
import type { ReportItem, SendtallyApi } from "@sendtally/api-client";
import { queuedOn, useModerationAction } from "@sendtally/features/areas";
import { ModCard } from "./ModCard";

export function ReportCard({
  api,
  item,
}: {
  api: SendtallyApi;
  item: ReportItem;
}): React.ReactElement {
  const { busy, error, run } = useModerationAction();
  const { entity } = item;
  const base = item.entity_type === "area" ? "/app/areas/" : "/app/climbs/";

  return (
    <ModCard
      kicker={`${item.entity_type === "area" ? "Area" : "Climb"} · ${queuedOn(item.created_at)}`}
      error={error}
      actions={
        <Button
          variant="azure"
          size="sm"
          disabled={busy}
          onClick={() => void run(() => api.resolveReport(item.id))}
        >
          Resolve
        </Button>
      }
    >
      {entity === null ? (
        <span className="mod-title">Deleted or merged</span>
      ) : (
        <Link to={`${base}${entity.slug}`} className="mod-title">
          {entity.name}
        </Link>
      )}
      <p className="mod-quote">{item.body}</p>
    </ModCard>
  );
}

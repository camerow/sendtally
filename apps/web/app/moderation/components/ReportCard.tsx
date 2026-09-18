import React from "react";
import { Link } from "react-router";
import { Button } from "@sendtally/design";
import type { ReportItem, SendtallyApi } from "@sendtally/api-client";
import { queuedOn, useModerationAction } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
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
      kicker={`${t(item.entity_type === "area" ? "moderation.area" : "moderation.climb")} · ${queuedOn(item.created_at)}`}
      error={error}
      actions={
        <Button
          variant="azure"
          size="sm"
          disabled={busy}
          onClick={() => void run(() => api.resolveReport(item.id))}
        >
          {t("moderation.resolve")}
        </Button>
      }
    >
      {entity === null ? (
        <span className="mod-title">{t("moderation.entityGone")}</span>
      ) : (
        <Link to={`${base}${entity.slug}`} className="mod-title">
          {entity.name}
        </Link>
      )}
      <p className="mod-quote">{item.body}</p>
    </ModCard>
  );
}

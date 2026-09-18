import React from "react";
import { Button } from "@sendtally/design";
import type { DuplicateItem, SendtallyApi } from "@sendtally/api-client";
import { queuedOn, useModerationAction } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { DuplicateSide } from "./DuplicateSide";
import { ModCard } from "./ModCard";
import { NoteDialog } from "./NoteDialog";

export function DuplicateCard({
  api,
  item,
}: {
  api: SendtallyApi;
  item: DuplicateItem;
}): React.ReactElement {
  const { busy, error, run } = useModerationAction();
  const [swap, setSwap] = React.useState(false);
  const [dismissing, setDismissing] = React.useState(false);
  const [survivor, merged] = swap ? [item.duplicate, item.keep] : [item.keep, item.duplicate];

  return (
    <ModCard
      kicker={`${t("moderation.duplicates")} · ${queuedOn(item.created_at)}`}
      error={dismissing ? null : error}
      actions={
        <>
          <Button variant="ghostOnLight" size="sm" onClick={() => setDismissing(true)}>
            {t("moderation.dismiss")}
          </Button>
          <Button
            variant="azure"
            size="sm"
            disabled={busy || survivor === null || merged === null}
            onClick={() => void run(() => api.mergeDuplicate(item.id, swap))}
          >
            {t("moderation.merge")}
          </Button>
        </>
      }
    >
      {item.note !== null && <p className="mod-quote">{item.note}</p>}
      <div className="mod-sides">
        <DuplicateSide label={t("moderation.survives")} climb={survivor} />
        <button
          type="button"
          className="mod-swap"
          aria-pressed={swap}
          onClick={() => setSwap((s) => !s)}
        >
          ⇄ {t("moderation.swap")}
        </button>
        <DuplicateSide label={t("moderation.mergedAway")} climb={merged} />
      </div>
      {dismissing && (
        <NoteDialog
          title={t("moderation.dismissTitle")}
          submitLabel={t("moderation.dismiss")}
          busy={busy}
          error={error}
          onClose={() => setDismissing(false)}
          onSubmit={(note) =>
            void run(async () => {
              await api.dismissDuplicate(item.id, note);
              setDismissing(false);
            })
          }
        />
      )}
    </ModCard>
  );
}

import React from "react";
import { useSearchParams } from "react-router";
import type { ModerationQueue, SendtallyApi } from "@sendtally/api-client";
import {
  MODERATION_TABS,
  moderationTabLabel,
  useModerationQueue,
  type ModerationTab,
} from "@sendtally/features/areas";
import { formatNumber } from "@sendtally/features/i18n";
import { useClientApi } from "../../lib/useClientApi";
import { AdminFrame } from "./AdminFrame";
import { CreationsPanel } from "./CreationsPanel";
import { DuplicateCard } from "./DuplicateCard";
import { ReportCard } from "./ReportCard";
import { RevisionCard } from "./RevisionCard";

const tabOf = (value: string | null): ModerationTab =>
  MODERATION_TABS.find((tab) => tab === value) ?? "creations";

function itemsOf(
  api: SendtallyApi,
  queue: ModerationQueue,
  tab: ModerationTab
): React.ReactElement[] {
  switch (tab) {
    case "creations":
      return [<CreationsPanel key="creations" api={api} />];
    case "revisions":
      return queue.revisions.items.map((item) => (
        <RevisionCard key={item.id} api={api} item={item} />
      ));
    case "duplicates":
      return queue.duplicates.items.map((item) => (
        <DuplicateCard key={item.id} api={api} item={item} />
      ));
    case "reports":
      return queue.reports.items.map((item) => <ReportCard key={item.id} api={api} item={item} />);
  }
}

function Queues({ api }: { api: SendtallyApi }): React.ReactElement {
  const { state } = useModerationQueue(api);
  const [params, setParams] = useSearchParams();
  const tab = tabOf(params.get("tab"));
  const queue = state.status === "ready" ? state.data : null;
  const current = queue?.[tab] ?? null;

  return (
    <>
      <div className="mod-tabs" role="tablist" aria-label="Areas queues">
        {MODERATION_TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={value === tab}
            className="mod-tab"
            onClick={() =>
              setParams(value === "creations" ? {} : { tab: value }, { replace: true })
            }
          >
            {moderationTabLabel(value)}
            {queue !== null && (
              <span className="mod-tab-count">{formatNumber(queue[value].count)}</span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mod-list" data-tab={tab}>
        {state.status === "loading" && <span className="area-meta">Loading…</span>}
        {state.status === "error" && (
          <span className="area-meta">Could not load the moderation queue.</span>
        )}
        {queue !== null && current !== null && (
          <>
            {current.count === 0 && tab !== "creations" && (
              <p className="area-empty">Nothing waiting here.</p>
            )}
            {itemsOf(api, queue, tab)}
            {tab !== "creations" && current.count > current.items.length && (
              <span className="area-meta">
                {`Showing ${current.items.length} of ${current.count}`}
              </span>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** Areas moderation: new areas and climbs, suggested edits, duplicates and reports. */
export function AreasPage({ apiUrl }: { apiUrl: string }): React.ReactElement {
  const api = useClientApi(apiUrl);
  return (
    <AdminFrame title="Areas" back={{ to: "/app/admin", label: "Admin" }}>
      <Queues api={api} />
    </AdminFrame>
  );
}

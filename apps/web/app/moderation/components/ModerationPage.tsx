import React from "react";
import { useSearchParams } from "react-router";
import type { ModerationQueue, SendtallyApi } from "@sendtally/api-client";
import { Logo } from "@sendtally/design";
import {
  MODERATION_TABS,
  moderationTabLabel,
  useModerationQueue,
  type ModerationTab,
} from "@sendtally/features/areas";
import { formatNumber, t } from "@sendtally/features/i18n";
import { useClientApi } from "../../lib/useClientApi";
import { CreationCard } from "./CreationCard";
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
      return queue.creations.items.map((item) => (
        <CreationCard
          key={item.entity_type === "area" ? item.area.id : item.climb.id}
          api={api}
          item={item}
        />
      ));
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

export function ModerationPage({ apiUrl }: { apiUrl: string }): React.ReactElement {
  const api = useClientApi(apiUrl);
  const { state } = useModerationQueue(api);
  const [params, setParams] = useSearchParams();
  const tab = tabOf(params.get("tab"));
  const queue = state.status === "ready" ? state.data : null;
  const current = queue?.[tab] ?? null;

  return (
    <div className="mod-page">
      <div className="sessions-head">
        <span className="sessions-head-mark">
          <Logo variant="mark" size={22} />
        </span>
        <h1 className="sessions-title">{t("moderation.title")}</h1>
      </div>

      <div className="mod-tabs" role="tablist" aria-label={t("moderation.queues")}>
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

      <div role="tabpanel" className="mod-list">
        {state.status === "loading" && <span className="area-meta">{t("common.loading")}</span>}
        {state.status === "error" && (
          <span className="area-meta">{t("moderation.loadFailed")}</span>
        )}
        {queue !== null && current !== null && (
          <>
            {current.count === 0 && <p className="area-empty">{t("moderation.empty")}</p>}
            {itemsOf(api, queue, tab)}
            {current.count > current.items.length && (
              <span className="area-meta">
                {t("moderation.showing", { shown: current.items.length, count: current.count })}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

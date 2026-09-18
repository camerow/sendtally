import React from "react";
import { useTrends } from "@sendtally/features/trends";
import { t } from "@sendtally/features/i18n";
import { MEMBERSHIP_PANEL_ID } from "../../billing/components/MembershipPanel";
import { UpgradePanel } from "../../billing/components/UpgradePanel";
import { useClientApi } from "../../lib/useClientApi";
import { FilterRow } from "./FilterRow";
import { ScopeControl } from "./ScopeControl";
import { TrendSection } from "./TrendSection";
import { TrendStats } from "./TrendStats";

export type TrendsOverviewProps = {
  apiUrl: string;
  preview?: boolean;
};

const scrollToPanel = (): void => {
  document
    .getElementById(MEMBERSHIP_PANEL_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export function TrendsOverview({
  apiUrl,
  preview = false,
}: TrendsOverviewProps): React.ReactElement {
  const api = useClientApi(apiUrl);
  const feature = useTrends(api, { preview });
  const { state } = feature;

  return (
    <div className="trends">
      <div className="trends-head">
        <div className="trends-title">
          <div className="trends-title-row">
            <h1>{t("common.trends")}</h1>
            {state.status === "ready" && (
              <span className="trend-mono trend-muted" style={{ fontSize: 11 }}>
                {state.data.sessionsLine}
              </span>
            )}
          </div>
          {state.status === "ready" && <p className="trends-insight">{state.data.insight}</p>}
        </div>
        {state.status === "ready" && <ScopeControl feature={feature} vm={state.data} />}
      </div>
      {state.status === "loading" && (
        <span className="trend-mono trend-muted" style={{ fontSize: 11, marginTop: 22 }}>
          {t("common.loading")}
        </span>
      )}
      {state.status === "error" && (
        <span className="trend-muted" style={{ fontSize: 13, marginTop: 22 }}>
          {t("trends.loadFailed")}
        </span>
      )}
      {state.status === "ready" && (
        <>
          <FilterRow feature={feature} vm={state.data} onLockedRange={scrollToPanel} />
          {state.data.stats !== null && <TrendStats stats={state.data.stats} />}
          <div className="trend-sections">
            {state.data.groups.map((group) => (
              <TrendSection
                key={group.id}
                group={group}
                onLockedLink={preview ? scrollToPanel : undefined}
              />
            ))}
          </div>
        </>
      )}
      {preview && (
        <div style={{ marginTop: 24 }}>
          <UpgradePanel />
        </div>
      )}
    </div>
  );
}

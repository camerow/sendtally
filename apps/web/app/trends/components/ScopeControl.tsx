import React from "react";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  TREND_SCOPES,
  scopeLabel,
  withScope,
  type TrendsFeature,
  type TrendsVM,
} from "@sendtally/features/trends";
import { Chevron, useDismiss } from "./DropButton";

/** Boulder | Route | All, plus More once a gym logs on its own circuit ladder. */
export function ScopeControl({
  feature,
  vm,
}: {
  feature: TrendsFeature;
  vm: TrendsVM;
}): React.ReactElement {
  const { filter, setFilter } = feature;
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback((): void => setOpen(false), []);
  const ref = useDismiss(open, close);
  const scaleGym =
    vm.scope === "circuit" ? vm.scaleGyms.find((g) => g.id === filter.gymId) : undefined;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div role="group" aria-label={t("common.discipline")} className="trend-scopes">
        {TREND_SCOPES.map((s) => (
          <button
            key={s}
            type="button"
            className="trend-scope"
            aria-pressed={vm.scope === s}
            onClick={() => setFilter((f) => withScope(f, s))}
          >
            {scopeLabel(s)}
          </button>
        ))}
        {vm.scaleGyms.length > 0 && (
          <button
            type="button"
            className="trend-scope"
            aria-pressed={scaleGym !== undefined}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {scaleGym !== undefined && (
              <span className="trend-scope-dots" aria-hidden="true">
                {scaleGym.ladder.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: CIRCUIT_HEX[c.colour],
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.5)",
                    }}
                  />
                ))}
              </span>
            )}
            {scaleGym?.name ?? t("trends.scopeMore")}
            <Chevron />
          </button>
        )}
      </div>
      {open && (
        <div className="trend-popover" style={{ width: 380 }}>
          <span className="trend-popover-title" style={{ display: "block", margin: "0 8px" }}>
            {t("trends.gymGrades")}
          </span>
          <p className="trend-popover-help" style={{ margin: "6px 8px 12px" }}>
            {t("trends.gymGradesBody")}
          </p>
          {vm.scaleGyms.map((g) => (
            <button
              key={g.id}
              type="button"
              className="trend-option"
              aria-pressed={scaleGym?.id === g.id}
              style={{
                flexDirection: "column",
                alignItems: "stretch",
                gap: 8,
                padding: "12px 8px",
              }}
              onClick={() => {
                setFilter((f) => withScope(f, "circuit", g.id));
                close();
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</span>
                <span className="trend-option-count">
                  {t("sessions.sessionCount", { count: g.sessions })}
                </span>
              </span>
              <span className="trend-ladder">
                {g.ladder.map((c) => (
                  <span key={c.id} className="trend-ladder-step">
                    <span
                      className="trend-ladder-swatch"
                      style={{ background: CIRCUIT_HEX[c.colour] }}
                    />
                    <span
                      className="trend-option-count"
                      style={{ fontSize: 9, whiteSpace: "nowrap" }}
                    >
                      {c.range}
                    </span>
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import React from "react";
import { Link } from "react-router";
import { isPullSetup, setupsOf, type GripSetup } from "@sendtally/core/hang";
import { kindLabel, loadChange } from "@sendtally/features/activities";
import { compareGrips, loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData } from "../data/HangDataContext";
import { EXERCISES_VIEW, gripPath } from "../exercises/paths";
import { SetupChips } from "./SetupChips";

const MIN_SHARE = 0.06;

/** Every grip's best completed load on one setup as a bar, heaviest first, with its change. */
export function CompareGripsPage(): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const setups = setupsOf(model.sessions);
  const [picked, setPicked] = React.useState<GripSetup | null>(null);
  const setup = picked ?? setups[0];
  const rows = setup === undefined ? [] : compareGrips(model.sessions, setup, model.gripName);
  const kind = setup !== undefined && isPullSetup(setup) ? "pull" : "hang";
  const bests = rows.map((r) => r.bestKg);
  const lo = Math.min(0, ...bests);
  const span = Math.max(...bests) - lo || 1;

  return (
    <DetailFrame backTo={EXERCISES_VIEW}>
      <div className="intro">
        <span className="train-label" style={{ color: KIND_LOOK.hangboard.ink }}>
          {kindLabel("hangboard")}
        </span>
        <h1 className="train-title intro-title">{t("hang.compareGrips")}</h1>
      </div>
      {setups.length > 1 && (
        <SetupChips setups={setups} picked={setup ?? null} onPick={setPicked} withAll={false} />
      )}
      {rows.length === 0 ? (
        <DashedPanel body={setups.length === 0 ? t("hang.trendsNone") : t("hang.compareEmpty")} />
      ) : (
        <div className="compare-rows">
          {rows.map((r) => {
            const best = loadLabel(kind, r.bestKg, unit);
            const change = loadChange(r.changeKg, unit);
            return (
              <Link
                key={r.gripId}
                to={gripPath(r.gripId)}
                className="compare-row"
                aria-label={`${r.name}, ${best}, ${change}`}
              >
                <span className="compare-row-line">
                  <span className="compare-row-name">{r.name}</span>
                  <span className="compare-row-best">{best}</span>
                  <span className="compare-row-change">{change}</span>
                </span>
                <span className="compare-bar">
                  <span
                    style={{
                      width: `${Math.round(Math.max(MIN_SHARE, (r.bestKg - lo) / span) * 100)}%`,
                    }}
                  />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </DetailFrame>
  );
}

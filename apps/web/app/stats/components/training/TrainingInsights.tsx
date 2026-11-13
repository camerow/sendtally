import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  TRAINED_KINDS,
  focusKey,
  pickedWorkouts,
  useTrainingInsights,
  type TrainedBy,
} from "@sendtally/features/statistics";
import type { TrendRange } from "@sendtally/features/trends";
import { useAppApi } from "../../../lib/useAppApi";
import { DashedPanel } from "../../../training/components/DashedPanel";
import { useHangData } from "../../../training/data/HangDataContext";
import { CurrentBlockRow } from "./CurrentBlockRow";
import { ExerciseGroups } from "./ExerciseGroups";
import { InsightsChart } from "./InsightsChart";
import { TrainedMix } from "./TrainedMix";
import { WorkoutsDone } from "./WorkoutsDone";

/** How hard and how often, what was trained, the block running, and every exercise's trend. */
export function TrainingInsights({ range }: { range: TrendRange }): React.ReactElement {
  const { model } = useHangData();
  const state = useTrainingInsights(useAppApi(), range, TRAINED_KINDS, model.gripName);
  const [by, setBy] = React.useState<TrainedBy>("category");
  const [pick, setPick] = React.useState<string | null>(null);

  if (state.status === "loading")
    return <span className="load-state-loading">{t("common.loading")}</span>;
  if (state.status === "error") return <span className="stats-error">{state.message}</span>;
  if (state.data.sessions === 0) return <DashedPanel body={t("statistics.empty")} />;
  const legend =
    by === "category"
      ? state.data.trained.map((k) => ({ key: k.kind, name: k.name }))
      : state.data.byFocus.map((f) => ({ key: focusKey(f.focus), name: f.name }));
  const picked = legend.find((r) => r.key === pick) ?? null;
  return (
    <div className="stats-grid">
      <p className="stats-summary stats-wide">{state.data.line}</p>
      <InsightsChart points={state.data.points} />
      <TrainedMix
        trained={state.data.trained}
        byFocus={state.data.byFocus}
        total={state.data.total}
        by={by}
        onBy={(next) => {
          setBy(next);
          setPick(null);
        }}
        picked={picked?.key ?? null}
        onPick={setPick}
      />
      <section className="stats-card">
        <CurrentBlockRow />
        <WorkoutsDone
          groups={pickedWorkouts(state.data.workouts[by], picked?.key ?? null)}
          picked={picked?.name ?? null}
          onClear={() => setPick(null)}
        />
      </section>
      <ExerciseGroups groups={state.data.exercises} />
    </div>
  );
}

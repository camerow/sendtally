import React from "react";
import { Text, View } from "react-native";
import type { HangSetup, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  partDoses,
  partHangs,
  partSetLine,
  partTotal,
  type PartInPlayer,
} from "@sendtally/features/workouts";
import { PartSets } from "../activity/PartSets";
import { Button } from "../components/Button";
import { type } from "../type";
import { HangDataProvider } from "../data/HangDataProvider";
import { FingersGrip } from "./FingersGrip";

export type FingersCardProps = {
  part: PartInPlayer;
  unit: WeightUnit;
  gripName: (id: string) => string;
  /** Opens the hang timer on the part's grips, or back where it was. */
  onStart: () => void;
  onRemoved: (message: string, undo: () => void) => void;
};

/**
 * A mix's fingerboard part in the workout view, where its first grip sits: a block per grip and Start;
 * Resume while the timer has it; once the timer ends, the sets it held to edit in place.
 */
export function FingersCard({
  part,
  unit,
  gripName,
  onStart,
  onRemoved,
}: FingersCardProps): React.ReactElement {
  const { planned, state } = part;
  const running = state !== undefined && "run" in state;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}>
          {t("workouts.fingerboard")}
        </Text>
        {state !== undefined && (
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
            {t("summary.hangsOf", { held: partHangs(state), total: partTotal(planned) })}
          </Text>
        )}
      </View>
      {state !== undefined && "done" in state ? (
        <PartSets
          done={state.done}
          planned={partDoses(planned)}
          setup={state.setups[0] ?? { edgeMm: 0, loadKg: 0 }}
          kind={planned.items[0].workout.kind}
          unit={unit}
          gripName={gripName}
          onSetup={(setup: HangSetup) =>
            part.change({ ...state, setups: [setup, ...state.setups.slice(1)] })
          }
          onChange={(done) => part.change({ ...state, done })}
          onRemoved={onRemoved}
        />
      ) : (
        <>
          <HangDataProvider>
            {planned.items.map((i, k) => (
              <FingersGrip
                key={k}
                workout={i.workout}
                dose={i.dose}
                setup={running ? state.setups[k] : undefined}
              />
            ))}
          </HangDataProvider>
          {running && (
            <Text style={[type.monoBold, { fontSize: 13, color: colors.gunmetal }]}>
              {partSetLine(state.run, planned, gripName)}
            </Text>
          )}
          <Button
            label={running ? t("hang.resume") : t("hang.start")}
            onPress={onStart}
            variant="primary"
            icon="play"
            height={48}
            style={{ marginTop: 4 }}
          />
        </>
      )}
    </View>
  );
}

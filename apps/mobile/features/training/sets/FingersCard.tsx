import React from "react";
import { Text, View } from "react-native";
import { currentPhase, protocolDose, type HangSetup, type WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { doseSummary, partHangs, type PartInPlayer } from "@sendtally/features/workouts";
import { PartSets } from "../activity/PartSets";
import { Button } from "../components/Button";
import { type } from "../type";

export type FingersCardProps = {
  part: PartInPlayer;
  unit: WeightUnit;
  gripName: (id: string) => string;
  /** Opens the hang timer on the part's grips, or back where it was. */
  onStart: () => void;
  onRemoved: (message: string, undo: () => void) => void;
};

/**
 * A mix's fingerboard part in the workout view, where its first grip sits: its grips and Start;
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
  const total = planned.items.reduce((n, i) => {
    const dose = i.dose ?? protocolDose(i.workout);
    return n + dose.sets * (dose.reps ?? 1);
  }, 0);
  const mark = (
    <View
      style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: KIND_LOOK.hangboard.ink }}
    />
  );
  return (
    <View
      style={{
        gap: 8,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 17, color: colors.gunmetal }]}>
          {t("workouts.fingerboard")}
        </Text>
        {state !== undefined && (
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
            {t("summary.hangsOf", { held: partHangs(state), total })}
          </Text>
        )}
      </View>
      {state !== undefined && "done" in state ? (
        <PartSets
          done={state.done}
          planned={planned.items.map((i) => i.dose ?? protocolDose(i.workout))}
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
          {planned.items.map((i, k) => (
            <View key={k} style={{ gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {mark}
                <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
                  {gripName(i.workout.grip)}
                </Text>
              </View>
              <Text
                style={[type.monoBold, { fontSize: 13, color: colors.gunmetal, paddingLeft: 18 }]}
              >
                {doseSummary("hangboard", i.dose ?? protocolDose(i.workout), unit)}
              </Text>
            </View>
          ))}
          {running && (
            <Text style={[type.monoBold, { fontSize: 13, color: colors.gunmetal }]}>
              {t("hang.setOf", { set: currentPhase(state.run).set, sets: state.run.sets })}
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

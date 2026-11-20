import { router } from "expo-router";
import { hangLoadText } from "@sendtally/features/hang";
import React from "react";
import { Text, View } from "react-native";
import { clock, type WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { type HangGripGrid } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { EffortMark } from "../components/EffortMark";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { SetRow } from "../sets/SetRow";
import { type } from "../type";

export type HangResultCardProps = {
  grid: HangGripGrid;
  gripName: string;
  unit: WeightUnit;
};

/** One grip of a finished hangboard session: a read row per set, its hangs as boxes, its load and RPE. */
export function HangResultCard({ grid, gripName, unit }: HangResultCardProps): React.ReactElement {
  const name =
    grid.kind === "hang" ? `${gripName} · ${t("hang.edgeMm", { n: grid.edgeMm })}` : gripName;
  const all = grid.rows.flat();
  const rated = grid.rpes.some((r) => r !== undefined);
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={name}
          onHistory={() => router.push({ pathname: "/grip/[id]", params: { id: grid.gripId } })}
        />
      }
    >
      {grid.rows.map((row, s) => {
        const load = grid.loads[s] ?? 0;
        const rpe = grid.rpes[s];
        return (
          <SetRow
            key={s}
            position={String(s + 1)}
            mode="read"
            label={t("summary.setN", { n: s + 1 })}
            {...(rated && { rpe: rpe === undefined ? null : <EffortMark rpe={rpe} /> })}
          >
            {row.length === 1 && grid.seconds[s] !== undefined ? (
              <Text style={[type.monoBold, { flex: 1, fontSize: 14, color: colors.gunmetal }]}>
                {row[0] === true ? clock(grid.seconds[s] ?? 0, true) : "–"}
              </Text>
            ) : (
              row.map((held, r) => (
                <View
                  key={r}
                  style={{
                    flex: 1,
                    height: 24,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: held ? colors.fern : "rgba(64,63,76,0.26)",
                    backgroundColor: held ? colors.fern : colors.white,
                  }}
                />
              ))
            )}
            <Text
              numberOfLines={1}
              style={[
                type.monoBold,
                { width: 72, fontSize: 14, textAlign: "right", color: colors.gunmetal },
              ]}
            >
              {hangLoadText(load, unit)}
            </Text>
          </SetRow>
        );
      })}
      <Text style={[type.monoBold, { paddingTop: 4, fontSize: 13, color: colors.gunmetal }]}>
        {t("summary.hangsOf", { held: all.filter(Boolean).length, total: all.length })}
      </Text>
    </ExerciseBlock>
  );
}

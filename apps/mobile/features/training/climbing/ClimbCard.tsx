import React from "react";
import { Text, View } from "react-native";
import type { SessionItem, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { setClimbOf, wallLeft, type Tally } from "@sendtally/features/log-session";
import {
  exerciseName,
  targetText,
  type ClimbPlan,
  type ClimbRow as ClimbSet,
} from "@sendtally/features/workouts";
import type { About } from "../components/AboutButton";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import type { DetailMenuRow } from "../components/types";
import { RestPreview } from "../rest/RestPreview";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { SET_COLUMNS } from "../sets/setColumns";
import { type } from "../type";
import { ClimbReadRow } from "./ClimbReadRow";
import { ClimbRow } from "./ClimbRow";
import { GradePicker } from "./GradePicker";
import { WallClock } from "./WallClock";

export type ClimbCardProps = {
  item: SessionItem;
  plan: ClimbPlan;
  rows: readonly ClimbSet[];
  unit: WeightUnit;
  /** The tally, while it is on this card; its current set takes the grades picked. */
  tally: Tally | null;
  /** The rest a set's end started, under it while it runs. */
  restUnder: (set: number) => React.ReactNode;
  about?: About | undefined;
  onHistory?: (() => void) | undefined;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
  onEdit: (key: string) => void;
};

function Headings(): React.ReactElement {
  return (
    <View style={[SET_COLUMNS.row, { minHeight: 20 }]}>
      <View style={SET_COLUMNS.position} />
      <Label small color={colors.textSecondary} style={{ width: 60 }}>
        {t("common.grade")}
      </Label>
      <Label small color={colors.textSecondary} style={{ flex: 1, textAlign: "center" }}>
        {t("climbs.attempts")}
      </Label>
      <Label
        small
        color={colors.textSecondary}
        style={{ width: SET_COLUMNS.tick.width, textAlign: "right" }}
      >
        {t("common.sent")}
      </Label>
    </View>
  );
}

/** A climbing exercise: a row per climb in each set, the grades under the set being climbed. */
export function ClimbCard({
  item,
  plan,
  rows,
  unit,
  tally,
  restUnder,
  about,
  onHistory,
  onFold,
  menu,
  onEdit,
}: ClimbCardProps): React.ReactElement {
  const restS = item.dose.setRestS ?? 0;
  const ex = tally?.draft?.exercise;
  const left = ex === undefined ? null : wallLeft(ex, tally?.now ?? new Date());
  const selected = tally?.selection?.kind === "row" ? tally.selection.key : null;
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={exerciseName(item.exercise)}
          target={targetText(item.dose, plan.onS === undefined ? "climbs" : "wallTime", unit)}
          about={about}
          {...(onHistory !== undefined && { onHistory })}
          onFold={onFold}
          menu={menu}
        />
      }
    >
      {rows.flatMap((row, i) => {
        const live = tally !== null && row.state === "current";
        const clock =
          live && plan.onS !== undefined && left !== null ? (
            <View key="wall" style={{ paddingTop: 8 }}>
              <WallClock
                targetS={plan.onS}
                left={left}
                running={ex?.setStartedAt !== undefined}
                onToggle={tally.toggleWall}
              />
            </View>
          ) : null;
        const rest =
          restUnder(row.set - 1) ||
          (i < rows.length - 1 && restS > 0 && <RestPreview seconds={restS} />);
        return [
          <View
            key={`label${row.set}`}
            style={{
              minHeight: 40,
              paddingTop: 6,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Label small color={colors.textSecondary}>
              {t("tally.setLabel", { set: row.set })}
            </Label>
            {live ? (
              <Button
                label={t("tally.endSet")}
                accessibilityLabel={t("workouts.endSet", { set: row.set })}
                onPress={tally.endSet}
                variant="link"
                height={40}
                style={{ paddingRight: 0 }}
              />
            ) : (
              row.state === "done" && (
                <Text style={[type.body, { fontSize: 13, color: colors.textMuted }]}>
                  {t("common.done")}
                </Text>
              )
            )}
          </View>,
          <View key={`climbs${row.set}`}>
            {live ? (
              <>
                {row.climbs.length > 0 && <Headings />}
                {row.climbs.map((c, n) => (
                  <ClimbRow
                    key={c.key}
                    position={n + 1}
                    climb={c}
                    selected={selected === c.key}
                    onSelect={() => tally.toggleRow(c.key)}
                    onRemove={() => tally.remove(c.key)}
                    onTries={(tries) => tally.setTries(c.key, tries)}
                    onFlip={() => tally.flip(c.key)}
                    onEdit={() => onEdit(c.key)}
                  />
                ))}
                <GradePicker tally={tally} />
              </>
            ) : (
              row.climbs.map((c, n) => (
                <ClimbReadRow key={c.key} position={n + 1} climb={setClimbOf(c)} />
              ))
            )}
          </View>,
          clock,
          rest === false || rest === null || rest === undefined ? null : (
            <React.Fragment key={`rest${row.set}`}>{rest}</React.Fragment>
          ),
        ];
      })}
    </ExerciseBlock>
  );
}

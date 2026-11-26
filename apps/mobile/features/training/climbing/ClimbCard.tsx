import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SessionItem, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { setClimbOf, wallLeft, type ClimbDraft, type Tally } from "@sendtally/features/log-session";
import { elapsedClock } from "@sendtally/features/sessions";
import { useDisplayScales } from "@sendtally/features/settings";
import {
  exerciseName,
  targetText,
  type ClimbPlan,
  type ClimbRow as ClimbSet,
} from "@sendtally/features/workouts";
import type { About } from "../components/AboutButton";
import { Label } from "../components/Label";
import type { DetailMenuRow } from "../components/types";
import { RestPreview } from "../rest/RestPreview";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { type } from "../type";
import { climbGradeText } from "./ClimbGrade";
import { ClimbHeadings } from "./ClimbHeadings";
import { ClimbRow } from "./ClimbRow";
import { GradePicker } from "./GradePicker";
import { WallClock } from "./WallClock";
import { useSessionTarget } from "../sets/sessionTarget";

export type ClimbCardProps = {
  item: SessionItem;
  plan: ClimbPlan;
  rows: readonly ClimbSet[];
  unit: WeightUnit;
  /** The workout tally: every climb's row changes on it, whichever card it is on. */
  tally: Tally;
  /** The grade picker is on this card, under its picked set. */
  picking: boolean;
  /** A press on the card outside its inputs moves the grade picker to it. */
  onPress: () => void;
  onPressSet: (set: number) => void;
  onAddSet: () => void;
  /** A climb taken out, for its Undo, with its grade as the climber reads it. */
  onRemoved: (climb: ClimbDraft, grade: string) => void;
  /** The rest a set's end started, under it while it runs. */
  restUnder: (set: number) => React.ReactNode;
  about?: About | undefined;
  onHistory?: (() => void) | undefined;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
  onEdit: (key: string) => void;
};

/** A climbing exercise: a row per climb in every set, the grades under the set they go to. */
export function ClimbCard({
  item,
  plan,
  rows,
  unit,
  tally,
  picking,
  onPress,
  onPressSet,
  onAddSet,
  onRemoved,
  restUnder,
  about,
  onHistory,
  onFold,
  menu,
  onEdit,
}: ClimbCardProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const restS = item.dose.setRestS ?? 0;
  const ex = picking ? tally.draft?.exercise : undefined;
  const left = ex === undefined ? null : wallLeft(ex, tally.now);
  const selected = tally.selection?.kind === "row" ? tally.selection.key : null;
  const scales = useDisplayScales();
  const headed = rows.find((r) => r.climbs.length > 0)?.set;
  const name = exerciseName(item.exercise);
  return (
    <ExerciseBlock
      onPress={onPress}
      head={
        <ExerciseHead
          name={name}
          target={targetText(item.dose, plan.onS === undefined ? "climbs" : "wallTime", unit, {
            sessionRpe,
          })}
          about={about}
          {...(onHistory !== undefined && { onHistory })}
          onFold={onFold}
          menu={menu}
        />
      }
      add={{
        label: t("activities.addSet"),
        accessibilityLabel: t("activities.addSetTo", { exercise: name }),
        onPress: onAddSet,
      }}
    >
      {rows.flatMap((row, i) => {
        const clock =
          ex !== undefined && row.state === "current" && plan.onS !== undefined && left !== null ? (
            <View key="wall" style={{ paddingTop: 8 }}>
              <WallClock
                targetS={plan.onS}
                left={left}
                running={ex.setStartedAt !== undefined}
                onToggle={tally.toggleWall}
              />
            </View>
          ) : null;
        const rest =
          restUnder(row.set - 1) ||
          (i < rows.length - 1 && restS > 0 && <RestPreview seconds={restS} />);
        return [
          <Pressable
            key={`label${row.set}`}
            onPress={() => onPressSet(row.set)}
            accessibilityRole="button"
            accessibilityLabel={t("workouts.climbInSet", { set: row.set })}
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
            {row.state === "done" && (
              <Text
                style={[
                  row.onS === null ? type.body : type.mono,
                  {
                    fontSize: 13,
                    color: row.onS === null ? colors.textMuted : colors.textSecondary,
                  },
                ]}
              >
                {row.onS === null
                  ? t("common.done")
                  : `${elapsedClock(row.onS)} · ${t("common.done")}`}
              </Text>
            )}
          </Pressable>,
          <View key={`climbs${row.set}`}>
            {row.set === headed && <ClimbHeadings />}
            {row.climbs.map((c, n) => (
              <ClimbRow
                key={c.key}
                position={n + 1}
                climb={setClimbOf(c)}
                selected={selected === c.key}
                onSelect={() => tally.toggleRow(c.key)}
                onRemove={() => {
                  tally.remove(c.key);
                  onRemoved(c, climbGradeText(c, scales));
                }}
                onTries={(tries) => tally.setTries(c.key, tries)}
                onFlip={() => tally.flip(c.key)}
                onEdit={() => onEdit(c.key)}
              />
            ))}
            {picking && row.picked && <GradePicker tally={tally} />}
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

import React from "react";
import { Pressable, Text, View } from "react-native";
import { clock, type SessionItem } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { Tally } from "@sendtally/features/log-session";
import type { ClimbPlan, ClimbRow } from "@sendtally/features/workouts";
import type { About } from "../components/AboutButton";
import { CheckBox } from "../components/CheckBox";
import { Label } from "../components/Label";
import { RowFill } from "../components/RowFill";
import type { DetailMenuRow } from "../components/types";
import { RestPreview } from "../rest/RestPreview";
import { ExerciseCardHead } from "../sets/ExerciseCardHead";
import { type } from "../type";
import { ClimbChip } from "./ClimbChip";
import { GradePicker } from "./GradePicker";

export type ClimbCardProps = {
  item: SessionItem;
  plan: ClimbPlan;
  rows: readonly ClimbRow[];
  /** The tally, while it is on this card; its current set takes the grades picked. */
  tally: Tally | null;
  /** The rest a set's end started, under it while it runs. */
  restUnder: (set: number) => React.ReactNode;
  about?: About | undefined;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
  onFlip: (key: string) => void;
  onEdit: (key: string) => void;
};

const column = (plan: ClimbPlan): string =>
  plan.onS !== undefined
    ? t("workouts.onTheWallFor", { time: clock(plan.onS) })
    : plan.climbs !== undefined
      ? t("workouts.climbsPerSet", { n: plan.climbs })
      : t("workouts.climbsColumn");

/** A climbing exercise as set rows: each set's climbs as chips, and the grades under the one being climbed. */
export function ClimbCard({
  item,
  plan,
  rows,
  tally,
  restUnder,
  about,
  onFold,
  menu,
  onFlip,
  onEdit,
}: ClimbCardProps): React.ReactElement {
  const restS = item.dose.setRestS ?? 0;
  const open = plan.climbs === undefined && plan.onS === undefined;
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        paddingTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <ExerciseCardHead item={item} about={about} onFold={onFold} menu={menu} />
      <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
        <Label small color={colors.textSecondary} style={{ width: 34 }}>
          {t("activities.colSet")}
        </Label>
        <Label small color={colors.textSecondary}>
          {column(plan)}
        </Label>
      </View>
      {rows.map((row, i) => {
        const current = tally !== null && row.state === "current";
        return (
          <React.Fragment key={row.set}>
            <View
              style={{
                minHeight: 44,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 4,
                paddingVertical: 6,
                borderRadius: 10,
                overflow: "hidden",
                backgroundColor: current ? colors.surfaceSoft : undefined,
              }}
            >
              {current && row.fill !== null && (
                <RowFill share={row.fill} color={colors.fern} opacity={0.35} />
              )}
              <Text style={[type.monoBold, { width: 30, fontSize: 14, color: colors.gunmetal }]}>
                {row.set}
              </Text>
              <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {row.climbs.map((c) => (
                  <ClimbChip
                    key={c.key}
                    climb={c}
                    onFlip={() => onFlip(c.key)}
                    onEdit={() => onEdit(c.key)}
                  />
                ))}
              </View>
              {row.note !== "" && (
                <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>
                  {row.note}
                </Text>
              )}
              {open && current ? (
                <Pressable
                  onPress={tally.endSet}
                  accessibilityRole="button"
                  accessibilityLabel={t("workouts.endSet", { set: row.set })}
                  hitSlop={8}
                >
                  <CheckBox checked={false} color={colors.fern} />
                </Pressable>
              ) : (
                <CheckBox checked={row.state === "done"} color={colors.fern} />
              )}
            </View>
            {current && <GradePicker tally={tally} />}
            {restUnder(row.set - 1) ||
              (i < rows.length - 1 && restS > 0 && <RestPreview seconds={restS} />)}
          </React.Fragment>
        );
      })}
    </View>
  );
}

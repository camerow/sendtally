import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { WeekGoal } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK, kindName } from "./kindLook";

export type GoalRowProps = {
  goal: WeekGoal;
  current: boolean;
  onOpen: () => void;
  onLog?: () => void;
};

/** A weekly goal, counted for its week rather than marked on any one day. */
export function GoalRow({ goal, current, onOpen, onLog }: GoalRowProps): React.ReactElement {
  const { item, done, target, status } = goal;
  const vars = { done, target };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingLeft: 14,
        paddingRight: onLog === undefined ? 14 : 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        overflow: "hidden",
      }}
    >
      <DayMark kind={item.kind} filled={status === "done"} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={t("plan.edit", { title: item.title })}
        style={pressRow({ flex: 1, gap: 3, paddingVertical: 10 })}
      >
        <Label small color={status === "missed" ? colors.watermelonInk : KIND_LOOK[item.kind].ink}>
          {kindName(item.kind)}
        </Label>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{item.title}</Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {current ? t("plan.goalThisWeek", vars) : t("plan.goalWeek", vars)}
        </Text>
      </Pressable>
      {onLog !== undefined && (
        <Button label={t("plan.logIt")} onPress={onLog} variant="outline" height={40} />
      )}
    </View>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import type { CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { PlanDayItem } from "@sendtally/features/training";
import { pressRow } from "../../../lib/press";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { planItemMeta } from "../plan/planItemText";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK } from "./kindLook";
import { planTag } from "./planTag";

export type PlanItemRowProps = {
  entry: PlanDayItem;
  date: CalendarDate;
  onOpen: () => void;
  onSkip: () => void;
};

/** A plan item on a day that is not today's to start: done, missed, or still to come. */
export function PlanItemRow({ entry, date, onOpen, onSkip }: PlanItemRowProps): React.ReactElement {
  const { plan, status, kind } = entry;
  const done = status === "done";
  const tag =
    status === "done"
      ? t("plan.done")
      : status === "missed"
        ? t("hang.missed")
        : planTag(t("hang.planned"), plan, date);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingLeft: 14,
        paddingRight: done ? 14 : 6,
        borderRadius: 14,
        borderWidth: done ? 1 : 1.5,
        borderStyle: done ? "solid" : "dashed",
        borderColor: done ? colors.lineOnLightStrong : "rgba(64,63,76,0.24)",
        overflow: "hidden",
      }}
    >
      <DayMark kind={kind} filled={done} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={t("plan.edit", { title: plan.title })}
        style={pressRow({ flex: 1, gap: 3, paddingVertical: 10 })}
      >
        <Label small color={status === "missed" ? colors.watermelonInk : KIND_LOOK[kind].ink}>
          {tag}
        </Label>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{plan.title}</Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {planItemMeta(plan)}
        </Text>
      </Pressable>
      {!done && (
        <IconButton
          icon="x"
          label={t("plan.skip", { title: plan.title, date: dayTitle(date) })}
          onPress={onSkip}
          color={colors.textSecondary}
        />
      )}
    </View>
  );
}

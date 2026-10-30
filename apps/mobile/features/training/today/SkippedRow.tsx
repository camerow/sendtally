import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { plannedOn, type Occurrence } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";
import { DayMark } from "./DayMark";

export type SkippedRowProps = { occurrence: Occurrence; workout: LibraryWorkout };

/** A planned run skipped: on its day, dashed and faded, with why and Undo skip. */
export function SkippedRow({ occurrence: o, workout }: SkippedRowProps): React.ReactElement {
  const actions = usePlanActions();
  const reason = o.change?.reason ?? null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: "rgba(64,63,76,0.24)",
        opacity: 0.6,
      }}
    >
      <DayMark kind={workout.kind} filled={false} missed />
      <View style={{ flex: 1, gap: 3 }}>
        <Label small color={colors.textSecondary}>
          {reason === null
            ? t("plan.skipped")
            : t("plan.skippedWhy", { reason: t(`plan.reason_${reason}`) })}
        </Label>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {workout.name}
        </Text>
        {o.change?.note !== null && o.change?.note !== undefined && (
          <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
            {o.change.note}
          </Text>
        )}
      </View>
      <Button
        label={t("plan.undoSkip")}
        onPress={() => void actions.undoPlanChange(o.membership.id, plannedOn(o))}
        variant="link"
        height={36}
      />
    </View>
  );
}

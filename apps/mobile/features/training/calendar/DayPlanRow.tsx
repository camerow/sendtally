import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { Occurrence } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import {
  logLibraryWorkout,
  runsTimed,
  startLibraryWorkout,
} from "../library-detail/startLibraryWorkout";
import { membershipWhen } from "../plans/planText";
import { DayMark } from "../today/DayMark";
import { occurrenceMeta } from "../today/occurrenceText";
import { type } from "../type";

export type DayPlanRowProps = { occurrence: Occurrence; workout: LibraryWorkout; today: boolean };

const STATUS = {
  done: () => t("plan.done"),
  missed: () => t("hang.missed"),
  planned: () => t("hang.planned"),
};

/** A workout planned on the day: what it asks for, whether it happened, and Start or Log when it is due. */
export function DayPlanRow({ occurrence: o, workout, today }: DayPlanRowProps): React.ReactElement {
  const { model } = useHangData();
  const link = { membershipId: o.membership.id, week: o.week, variation: o.variation };
  const log = (): void => logLibraryWorkout(workout, o.date, link);
  const due = (today && o.status === "planned") || o.status === "missed";
  const logLabel = workout.kind === "climbing" ? t("plan.logSession") : t("plan.logIt");
  return (
    <View
      style={{
        gap: 10,
        padding: 14,
        borderRadius: 14,
        borderWidth: o.status === "done" ? 0 : 1.5,
        borderStyle: o.status === "missed" ? "dashed" : "solid",
        borderColor: o.status === "missed" ? "rgba(64,63,76,0.35)" : colors.lineOnLightStrong,
        backgroundColor: o.status === "done" ? colors.surfaceSoft : colors.white,
      }}
    >
      <Pressable
        onPress={() => router.push({ pathname: "/workout/preview", params: { id: workout.id } })}
        accessibilityRole="button"
        style={({ pressed }) => ({ gap: 6, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <DayMark
            kind={workout.kind}
            filled={o.status === "done"}
            missed={o.status === "missed"}
            scale={1.2}
          />
          <Text style={[type.bodyBold, { flex: 1, fontSize: 16, color: colors.gunmetal }]}>
            {workout.name}
          </Text>
          <Label small color={o.status === "missed" ? colors.watermelonInk : colors.textSecondary}>
            {STATUS[o.status]()}
          </Label>
        </View>
        <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>
          {occurrenceMeta(o, model.settings.units)}
        </Text>
        <Label small color={colors.textSecondary}>
          {[membershipWhen(o.membership), o.block?.name].filter((p) => p !== undefined).join(" · ")}
        </Label>
      </Pressable>
      {due && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {today && runsTimed(workout, o.items) && (
            <Button
              label={t("hang.start")}
              onPress={() => startLibraryWorkout(workout, o.date, { link, items: o.items })}
              variant="primary"
              height={44}
              icon="play"
              style={{ flex: 1 }}
            />
          )}
          <Button
            label={logLabel}
            onPress={log}
            variant="outline"
            height={44}
            icon="plus"
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}

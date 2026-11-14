import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../../components/Sheet";
import { useRunWorkout } from "../library/useLibrary";
import { KIND_LOOK } from "@sendtally/features/training";
import { type } from "../type";
import { IconButton } from "./IconButton";
import { SheetHeader } from "./SheetHeader";

export type WorkoutInfoProps = { workoutId: string; color: string };

/** An info button beside a running workout's name, opening its description; none without one. */
export function WorkoutInfo({ workoutId, color }: WorkoutInfoProps): React.ReactElement | null {
  const workout = useRunWorkout(workoutId);
  const [open, setOpen] = React.useState(false);
  if (workout === undefined || workout.description === "") return null;
  const close = (): void => setOpen(false);
  return (
    <>
      <IconButton
        icon="info"
        label={t("workouts.about")}
        onPress={() => setOpen(true)}
        color={color}
        size={28}
        iconSize={18}
      />
      <Sheet visible={open} onClose={close} closeLabel={t("common.done")}>
        <View style={{ gap: 12, paddingHorizontal: 18, paddingBottom: 12 }}>
          <SheetHeader
            kicker={kindLabel(workout.kind)}
            kickerColor={KIND_LOOK[workout.kind].ink}
            title={workout.name}
            action={t("common.done")}
            onAction={close}
          />
          <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.textSecondary }]}>
            {workout.description}
          </Text>
        </View>
      </Sheet>
    </>
  );
}

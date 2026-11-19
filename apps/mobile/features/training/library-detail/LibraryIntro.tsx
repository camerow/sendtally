import React from "react";
import { View } from "react-native";
import { kindLabel } from "@sendtally/features/activities";
import { focusBeside, KIND_LOOK } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Description } from "../components/Description";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { CategoryMark } from "../library/CategoryMark";

export type LibraryIntroProps = {
  workout: LibraryWorkout;
  /** In place of the kind's kicker, such as the block a planned run is in. */
  kicker?: string;
  /** Under the name, such as a planned run's day. */
  day?: React.ReactNode;
};

/** A workout's kicker (kind and focus), name, its day when planned, and what it is for. */
export function LibraryIntro({
  workout,
  kicker: shown,
  day,
}: LibraryIntroProps): React.ReactElement {
  const kicker = [
    kindLabel(workout.kind),
    ...focusBeside(kindLabel(workout.kind), workout.focus),
  ].join(" · ");
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <CategoryMark kind={workout.kind} size={28} />
        <Label color={KIND_LOOK[workout.kind].ink}>{shown ?? kicker}</Label>
      </View>
      <Title size={34}>{workout.name}</Title>
      {day}
      <Description text={workout.description} fold />
    </View>
  );
}

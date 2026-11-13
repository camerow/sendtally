import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { LIVE_HEADER, MinimiseButton } from "../../../components/MinimiseButton";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { ON_DARK, ON_DARK_LINE, ON_DARK_SOFT } from "@sendtally/features/workouts";
import { WorkoutInfo } from "../components/WorkoutInfo";
import { type } from "../type";

export type TimerHeaderProps = {
  name: string;
  meta: string;
  /** Its description behind an info button beside the name. */
  workoutId: string | null;
  muted: boolean;
  onEnd: () => void;
  onToggleMute: () => void;
};

/** Minimise, which leaves the run going on the live bar, the workout, mute, and End. */
export function TimerHeader({
  name,
  meta,
  workoutId,
  muted,
  onEnd,
  onToggleMute,
}: TimerHeaderProps): React.ReactElement {
  return (
    <View style={LIVE_HEADER}>
      <MinimiseButton color={ON_DARK} />
      <View style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2, maxWidth: "100%" }}>
          <Text
            style={[type.bodyBold, { flexShrink: 1, fontSize: 15, color: ON_DARK }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {workoutId !== null && <WorkoutInfo workoutId={workoutId} color={ON_DARK_SOFT} />}
        </View>
        <Label small color={ON_DARK_SOFT}>
          {meta}
        </Label>
      </View>
      <IconButton
        icon={muted ? "muted" : "sound"}
        label={muted ? t("hang.unmute") : t("hang.mute")}
        onPress={onToggleMute}
        color={ON_DARK}
        border={ON_DARK_LINE}
        iconSize={20}
      />
      <Button label={t("hang.end")} onPress={onEnd} variant="goldText" height={44} />
    </View>
  );
}

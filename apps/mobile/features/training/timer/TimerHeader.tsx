import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { ON_DARK, ON_DARK_LINE } from "@sendtally/features/workouts";
import { LIVE_HEADER, MinimiseButton } from "../../../components/MinimiseButton";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";

export type TimerHeaderProps = {
  muted: boolean;
  onEnd: () => void;
  onToggleMute: () => void;
};

/** Minimise, which leaves the run going on the live bar, then mute and End. */
export function TimerHeader({ muted, onEnd, onToggleMute }: TimerHeaderProps): React.ReactElement {
  return (
    <View style={LIVE_HEADER}>
      <MinimiseButton color={ON_DARK} />
      <View style={{ flex: 1 }} />
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

import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { LIVE_HEADER, MinimiseButton } from "../../../components/MinimiseButton";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { ON_DARK, ON_DARK_LINE, ON_DARK_SOFT } from "../components/onDark";
import { type } from "../type";

export type TimerHeaderProps = {
  name: string;
  meta: string;
  muted: boolean;
  onEnd: () => void;
  onToggleMute: () => void;
};

/** Minimise, which leaves the run going on the live bar, the workout, mute, and End. */
export function TimerHeader({
  name,
  meta,
  muted,
  onEnd,
  onToggleMute,
}: TimerHeaderProps): React.ReactElement {
  return (
    <View style={LIVE_HEADER}>
      <MinimiseButton color={ON_DARK} />
      <View style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 2 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: ON_DARK }]} numberOfLines={1}>
          {name}
        </Text>
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

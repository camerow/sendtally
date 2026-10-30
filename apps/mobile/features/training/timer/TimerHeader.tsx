import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
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

const LINK = { paddingHorizontal: 4 } as const;

/** Minimise, which leaves the run going on the live bar, the workout, mute, and End. */
export function TimerHeader({
  name,
  meta,
  muted,
  onEnd,
  onToggleMute,
}: TimerHeaderProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Button
        label={t("tally.minimise")}
        onPress={() => router.back()}
        variant="outlineDark"
        height={44}
        style={[LINK, { borderWidth: 0 }]}
      />
      <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
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
      <Button
        label={t("hang.end")}
        onPress={onEnd}
        variant="outlineDark"
        height={44}
        style={{ borderRadius: 22 }}
      />
    </View>
  );
}

import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

export type TimerHeaderProps = {
  name: string;
  meta: string;
  muted: boolean;
  onEnd: () => void;
  onToggleMute: () => void;
};

export function TimerHeader({
  name,
  meta,
  muted,
  onEnd,
  onToggleMute,
}: TimerHeaderProps): React.ReactElement {
  const c = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Button label={t("hang.end")} onPress={onEnd} variant="outlineDark" height={40} />
      <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: c.onDark }]} numberOfLines={1}>
          {name}
        </Text>
        <Label small color={c.onDark3}>
          {meta}
        </Label>
      </View>
      <IconButton
        icon={muted ? "muted" : "sound"}
        label={muted ? t("hang.unmute") : t("hang.mute")}
        onPress={onToggleMute}
        color={c.onDark}
        border={c.lineDark}
        iconSize={18}
      />
    </View>
  );
}

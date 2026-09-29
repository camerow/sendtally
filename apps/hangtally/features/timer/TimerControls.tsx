import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useAnimatedColor } from "./useAnimatedColor";

export type TimerControlsProps = {
  color: string;
  primary: string;
  next: string;
  fail: string | null;
  onPrimary: () => void;
  onFail: () => void;
  onRestart: () => void;
  onSkip: () => void;
};

/** Came off early / missed lift, what comes next, and restart · primary · skip. */
export function TimerControls({
  color,
  primary,
  next,
  fail,
  onPrimary,
  onFail,
  onRestart,
  onSkip,
}: TimerControlsProps): React.ReactElement {
  const c = useTheme();
  const fill = useAnimatedColor(color);
  const primaryStyle = useAnimatedStyle(() => ({ backgroundColor: fill.value }));
  return (
    <View style={{ gap: 12 }}>
      {fail !== null && (
        <Button
          label={fail}
          onPress={onFail}
          variant="outlineDark"
          height={52}
          icon="x"
          style={{ borderWidth: 1.5, borderColor: c.onDark3 }}
        />
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: c.lineDark,
        }}
      >
        <Label color={c.onDark3}>{t("hang.next")}</Label>
        <Text style={[type.mono, { fontSize: 14, color: c.onDark }]}>{next}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <IconButton
          icon="restart"
          label={t("hang.restartInterval")}
          onPress={onRestart}
          color={c.onDark}
          border={c.lineDark}
          size={64}
          square
          iconSize={22}
        />
        <Pressable onPress={onPrimary} accessibilityRole="button" style={{ flex: 1 }}>
          {({ pressed }) => (
            <Animated.View
              style={[
                {
                  height: 64,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                },
                primaryStyle,
              ]}
            >
              <Text style={[type.bodyBold, { fontSize: 18, color: c.deep }]}>{primary}</Text>
            </Animated.View>
          )}
        </Pressable>
        <IconButton
          icon="skip"
          label={t("hang.skipInterval")}
          onPress={onSkip}
          color={c.onDark}
          border={c.lineDark}
          size={64}
          square
          iconSize={22}
        />
      </View>
    </View>
  );
}

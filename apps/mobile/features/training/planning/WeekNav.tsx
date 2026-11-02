import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";

export type WeekNavProps = { week: number; weeks: number; onPick: (week: number) => void };

/** A block week's title between arrows to the week before and after. */
export function WeekNav({ week, weeks, onPick }: WeekNavProps): React.ReactElement {
  const arrow = (icon: "back" | "forward", label: string, to: number): React.ReactElement => (
    <IconButton
      icon={icon}
      label={label}
      onPress={() => onPick(to)}
      disabled={to < 1 || to > weeks}
      color={colors.gunmetal}
      border={colors.lineOnLightStrong}
      size={36}
    />
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      {arrow("back", t("hang.previousWeek"), week - 1)}
      <Label color={colors.gunmetal} style={{ flex: 1, textAlign: "center" }}>
        {t("plan.weekNumber", { n: week })}
      </Label>
      {arrow("forward", t("hang.nextWeek"), week + 1)}
    </View>
  );
}

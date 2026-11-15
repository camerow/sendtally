import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { type } from "../type";

export type ExtraSetsProps = {
  exercise: string;
  sets: number;
  max: number;
  canAdd: boolean;
  onAdd: () => void;
};

/** Under a set range's sets: one more to add once those are done, or how many of its top it reached. */
export function ExtraSets({
  exercise,
  sets,
  max,
  canAdd,
  onAdd,
}: ExtraSetsProps): React.ReactElement | null {
  if (canAdd)
    return (
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        <Button
          label={t("activities.addSetUpTo", { n: max })}
          accessibilityLabel={t("activities.addSetTo", { exercise })}
          onPress={onAdd}
          variant="outline"
          icon="plus"
          height={40}
        />
      </View>
    );
  if (sets < max) return null;
  return (
    <Text style={[type.mono, { fontSize: 12, color: colors.textMuted, paddingTop: 6 }]}>
      {t("activities.setsOfMax", { n: sets, max })}
    </Text>
  );
}

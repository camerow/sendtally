import React from "react";
import { Pressable, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";

export function AddTabButton({ onPress }: { onPress: () => void }): React.ReactElement {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t("training.add")}
        style={press({
          width: 54,
          height: 54,
          marginTop: -14,
          borderRadius: 27,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.gunmetal,
          shadowColor: "#35343F",
          shadowOpacity: 0.28,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        })}
      >
        <Icon name="plus" size={24} strokeWidth={2.6} color={colors.gold} />
      </Pressable>
    </View>
  );
}

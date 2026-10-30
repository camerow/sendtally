import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { NewBestVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { Label } from "../components/Label";
import { ON_DARK, ON_DARK_MUTED } from "../components/onDark";
import { type } from "../type";

/** A session that beat its grip's best on the same setup: gunmetal with a gold glow and star. */
export function NewBestCard({ best }: { best: NewBestVM }): React.ReactElement {
  return (
    <View
      accessible
      accessibilityLabel={`${t("hang.newBest")}, ${best.title}, ${best.meta}`}
      style={{
        minHeight: 82,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.gunmetal,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -60,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: colors.gold,
          opacity: 0.14,
        }}
      />
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.gold,
        }}
      >
        <Icon name="star" size={18} strokeWidth={2} color={colors.gunmetal} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Label small color={colors.gold}>
          {t("hang.newBest")}
        </Label>
        <Text style={[type.display, { fontSize: 19, lineHeight: 22, color: ON_DARK }]}>
          {best.title}
        </Text>
        <Text style={[type.mono, { fontSize: 11, color: ON_DARK_MUTED }]}>{best.meta}</Text>
      </View>
    </View>
  );
}

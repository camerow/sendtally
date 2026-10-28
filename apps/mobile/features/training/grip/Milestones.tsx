import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { MilestoneVM } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { Label } from "../components/Label";
import { type } from "../type";

/** A grip's milestones, each a gold star in a gunmetal circle with what happened and when. */
export function Milestones({ rows }: { rows: readonly MilestoneVM[] }): React.ReactElement | null {
  if (rows.length === 0) return null;
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <Label color={colors.gunmetal}>{t("hang.milestones")}</Label>
      {rows.map((m) => (
        <View
          key={m.key}
          accessible
          style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.gunmetal,
            }}
          >
            <Icon name="star" size={15} strokeWidth={2} color={colors.gold} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={[type.bodyBold, { fontSize: 14, color: colors.gunmetal }]}>{m.text}</Text>
            <Text style={[type.mono, { fontSize: 11, color: colors.textMuted }]}>{m.meta}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

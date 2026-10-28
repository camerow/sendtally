import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { Button } from "../components/Button";
import { type } from "../type";
import type { Rest } from "./restCountdown";

export type RestRowProps = {
  rest: Rest;
  left: number;
  onMore: () => void;
  onSkip: () => void;
};

/** A rest counting down inline: a gold fill drains with it, and it takes more time or a skip. */
export function RestRow({ rest, left, onMore, onSkip }: RestRowProps): React.ReactElement {
  const share = Math.min(1, left / rest.seconds);
  return (
    <View
      accessibilityLabel={t("activities.restLeft", { time: elapsedClock(left) })}
      style={{
        minHeight: rest.next === null ? 48 : 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingLeft: 12,
        paddingRight: 6,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${share * 100}%`,
          backgroundColor: colors.gold,
          opacity: 0.55,
        }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text style={[type.bodyBold, { fontSize: 13, color: colors.gunmetal }]}>
            {t("hang.rest")}
          </Text>
          <Text
            style={[
              type.monoBold,
              { fontSize: rest.next === null ? 20 : 22, color: colors.gunmetal },
            ]}
          >
            {elapsedClock(left)}
          </Text>
        </View>
        {rest.next !== null && (
          <Text style={[type.body, { fontSize: 12.5, color: colors.textSecondary }]}>
            {t("activities.restNext", { name: rest.next })}
          </Text>
        )}
      </View>
      <Button label={t("activities.restMore")} onPress={onMore} variant="link" height={40} />
      <Button label={t("activities.restSkip")} onPress={onSkip} variant="link" height={40} />
    </View>
  );
}

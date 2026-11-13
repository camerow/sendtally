import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { type } from "../type";
import { restRowVM, type Rest } from "@sendtally/features/workouts";

export type RestRowProps =
  | { rest: Rest; left: number; onMore: () => void; onSkip: () => void }
  /** A rest still to start, which waits for play. */
  | { rest: null; seconds: number; onStart: () => void };

/**
 * A rest counting down inline: a gold fill drains with it, and it takes more time or a skip. A
 * row of the set table between sets, between the cards with what is next between exercises.
 */
export function RestRow(props: RestRowProps): React.ReactElement {
  if (props.rest === null) return <IdleRest seconds={props.seconds} onStart={props.onStart} />;
  const { rest, left, onMore, onSkip } = props;
  const vm = restRowVM(rest, left);
  return (
    <View
      accessibilityLabel={vm.label}
      style={{
        minHeight: vm.next === null ? 48 : 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingLeft: 12,
        paddingRight: 6,
        borderRadius: rest.next === null ? 10 : 12,
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
          width: `${vm.share * 100}%`,
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
            {vm.clock}
          </Text>
        </View>
        {vm.next !== null && (
          <Text style={[type.body, { fontSize: 12.5, color: colors.textSecondary }]}>
            {vm.next}
          </Text>
        )}
      </View>
      <Button label={t("activities.restMore")} onPress={onMore} variant="link" height={40} />
      <Button label={t("activities.restSkip")} onPress={onSkip} variant="link" height={40} />
    </View>
  );
}

function IdleRest({
  seconds,
  onStart,
}: {
  seconds: number;
  onStart: () => void;
}): React.ReactElement {
  return (
    <View
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingLeft: 12,
        paddingRight: 4,
        borderRadius: 10,
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <Text style={[type.bodyBold, { fontSize: 13, color: colors.gunmetal }]}>
        {t("hang.rest")}
      </Text>
      <Text style={[type.monoBold, { flex: 1, fontSize: 20, color: colors.gunmetal }]}>
        {elapsedClock(seconds)}
      </Text>
      <IconButton
        icon="play"
        label={t("tally.startRest")}
        onPress={onStart}
        color={colors.gunmetal}
        size={40}
        iconSize={16}
      />
    </View>
  );
}

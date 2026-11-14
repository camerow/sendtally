import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { type } from "../type";
import { holdRowVM, type Hold } from "@sendtally/features/workouts";

export type HoldRowProps = {
  hold: Hold;
  now: number;
  /** What sits first, as the set table's set number. */
  lead?: React.ReactNode;
  onPause: () => void;
  onResume: () => void;
  onDone: () => void;
};

/**
 * A timed set running where it sits, the rest row's twin: a green fill grows toward the target
 * as it counts up, after a count-in, and Done ends it early.
 */
export function HoldRow({
  hold,
  now,
  lead,
  onPause,
  onResume,
  onDone,
}: HoldRowProps): React.ReactElement {
  const vm = holdRowVM(hold, now);
  return (
    <View
      accessibilityLabel={vm.label}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingRight: 6,
        borderRadius: 10,
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
          backgroundColor: colors.fern,
          opacity: 0.16,
        }}
      />
      {lead ?? <View style={{ width: 12 }} />}
      <View style={{ flex: 1, flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        {vm.word !== null && (
          <Text style={[type.bodyBold, { fontSize: 13, color: colors.gunmetal }]}>{vm.word}</Text>
        )}
        <Text style={[type.monoBold, { fontSize: 20, color: colors.gunmetal }]}>{vm.clock}</Text>
        {vm.of !== null && (
          <Text style={[type.mono, { fontSize: 12.5, color: colors.textSecondary }]}>{vm.of}</Text>
        )}
      </View>
      <Button
        label={vm.paused ? t("hang.resume") : t("hang.pause")}
        onPress={vm.paused ? onResume : onPause}
        variant="link"
        height={40}
      />
      <Button label={t("common.done")} onPress={onDone} variant="link" height={40} />
    </View>
  );
}

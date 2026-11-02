import React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { type } from "../type";

export type HangGridProps = {
  /** Each set's hangs, done or not. */
  rows: readonly (readonly boolean[])[];
  /** Tapping a hang toggles it, and a set's name fills it or clears it when full. */
  onChange?: (rows: boolean[][]) => void;
};

const cell = (done: boolean): ViewStyle => ({
  flex: 1,
  height: 24,
  borderRadius: 7,
  borderWidth: 2,
  borderColor: done ? colors.fern : "rgba(64,63,76,0.26)",
  backgroundColor: done ? colors.fern : colors.white,
});

/** A hangboard session's hangs, set by set: every cell the same box, done ones green. */
export function HangGrid({ rows, onChange }: HangGridProps): React.ReactElement {
  const held = rows.flat().filter(Boolean).length;
  const total = rows.flat().length;
  const change = (s: number, row: (r: boolean[]) => boolean[]): void =>
    onChange?.(rows.map((r, i) => (i === s ? row([...r]) : [...r])));
  return (
    <View
      accessible={onChange === undefined}
      accessibilityLabel={t("summary.hangsOf", { held, total })}
    >
      {rows.map((row, s) => {
        const name = t("summary.setN", { n: s + 1 });
        const label = { width: 52, fontSize: 14, paddingVertical: 2 };
        return (
          <View
            key={s}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              height: onChange === undefined ? 30 : 36,
            }}
          >
            {onChange === undefined ? (
              <Text style={[type.mono, label, { color: colors.textSecondary }]}>{name}</Text>
            ) : (
              <Pressable
                onPress={() => change(s, (r) => r.map(() => !r.every(Boolean)))}
                accessibilityRole="button"
                accessibilityLabel={name}
                hitSlop={6}
                style={press({})}
              >
                <Text style={[type.monoBold, label, { color: colors.azureInk }]}>{name}</Text>
              </Pressable>
            )}
            {row.map((done, r) =>
              onChange === undefined ? (
                <View key={r} style={cell(done)} />
              ) : (
                <Pressable
                  key={r}
                  onPress={() => change(s, (x) => x.map((d, i) => (i === r ? !d : d)))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={`${name}, ${r + 1}`}
                  hitSlop={{ top: 6, bottom: 6 }}
                  style={press(cell(done))}
                />
              )
            )}
          </View>
        );
      })}
    </View>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  entryNumber,
  entrySeconds,
  numberEntry,
  openNumber,
  openTime,
  timeEntry,
  timeText,
  type EntryAction,
  type NumberLimits,
  type TimeLimits,
} from "@sendtally/core/hang";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import { press } from "../lib/press";
import { Sheet } from "./Sheet";

export type KeypadMode =
  ({ kind: "time" } & TimeLimits) | ({ kind: "number"; unit?: string } & NumberLimits);

export type KeypadProps = {
  visible: boolean;
  label: string;
  mode: KeypadMode;
  /** Seconds in time mode. The first digit typed replaces it. */
  value: number;
  /** Done, Next and a tap outside all commit; an unchanged value is not committed. */
  onCommit: (value: number) => void;
  onClose: () => void;
  /** Shows a Next key that commits, closes and calls this. */
  onNext?: () => void;
};

type Entries = {
  time: ReturnType<typeof openTime>;
  number: ReturnType<typeof openNumber>;
  committed: boolean;
};

const NUMBER_DEFAULTS: NumberLimits = { step: 1 };

const decimalMark = (): string => formatNumber(1.5).replace(/[15]/g, "");

type KeyLook = "digit" | "side" | "done" | "next";

const FILL: Record<KeyLook, string> = {
  digit: colors.white,
  side: colors.surfaceSoft,
  done: colors.gold,
  next: colors.gunmetal,
};

/** An in-app keypad for a length of time or a number, with its field's label and live value on top. */
export function Keypad({
  visible,
  label,
  mode,
  value,
  onCommit,
  onClose,
  onNext,
}: KeypadProps): React.ReactElement | null {
  const limits = mode.kind === "number" ? mode : NUMBER_DEFAULTS;
  const open = (): Entries => ({
    time: openTime(value, mode),
    number: openNumber(value, limits),
    committed: false,
  });
  const [entries, setEntries] = React.useState(open);
  const [wasVisible, setWasVisible] = React.useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setEntries(open());
  }

  const reduce = (e: Entries, action: EntryAction): Entries =>
    mode.kind === "time"
      ? { ...e, time: timeEntry(e.time, action, mode) }
      : { ...e, number: numberEntry(e.number, action, limits) };
  const valueOf = (e: Entries): number =>
    mode.kind === "time" ? entrySeconds(e.time) : entryNumber(e.number);

  const finish = (): void => {
    if (entries.committed) return;
    const done = reduce(entries, { type: "done" });
    setEntries({ ...done, committed: true });
    if (valueOf(done) !== value) onCommit(valueOf(done));
  };
  const close = (): void => {
    finish();
    onClose();
  };
  const next = (): void => {
    close();
    onNext?.();
  };

  const [zeros, shown] =
    mode.kind === "time"
      ? timeText(entries.time)
      : [
          "",
          `${entries.number.text.replace(".", decimalMark()).replace("-", "−")}${mode.unit === undefined ? "" : ` ${mode.unit}`}`,
        ];
  const step = mode.kind === "time" ? "30s" : formatNumber(limits.step);

  const key = (
    text: string,
    onPress: (() => void) | null,
    look: KeyLook = "digit",
    a11y?: string
  ): React.ReactElement =>
    onPress === null ? (
      <View key={text} style={{ flex: 1 }} />
    ) : (
      <Pressable
        key={text}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y ?? text}
        style={press({
          flex: 1,
          height: 48,
          borderRadius: radius.control,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: FILL[look],
          borderWidth: look === "digit" || look === "side" ? 1 : 0,
          borderColor: colors.lineOnLight,
        })}
      >
        <Text
          style={{
            fontFamily: look === "digit" ? fonts.monoMedium : fonts.sansSemiBold,
            fontSize: look === "digit" ? 20 : 14,
            color: look === "next" ? colors.white : colors.gunmetal,
          }}
        >
          {text}
        </Text>
      </Pressable>
    );
  const send = (action: EntryAction) => (): void => setEntries((e) => reduce(e, action));
  const digit = (d: string): React.ReactElement => key(d, send({ type: "digit", digit: d }));
  const signed = mode.kind === "number" && mode.signed === true;
  const decimals = mode.kind === "number" && mode.decimals === true;

  const rows: React.ReactElement[][] = [
    [
      digit("1"),
      digit("2"),
      digit("3"),
      key(
        `−${step}`,
        send({ type: "minus" }),
        "side",
        t("common.subtractAmount", { amount: step })
      ),
    ],
    [
      digit("4"),
      digit("5"),
      digit("6"),
      key(`+${step}`, send({ type: "plus" }), "side", t("common.addAmount", { amount: step })),
    ],
    [
      digit("7"),
      digit("8"),
      digit("9"),
      key("⌫", send({ type: "back" }), "side", t("common.deleteDigit")),
    ],
    [
      signed
        ? key("±", send({ type: "sign" }), "side", t("common.changeSign"))
        : key(t("common.next"), onNext === undefined ? null : next, "next"),
      digit("0"),
      decimals
        ? key(decimalMark(), send({ type: "decimal" }), "digit", t("common.decimalPoint"))
        : digit("00"),
      key(t("common.done"), close, "done"),
    ],
  ];

  return (
    <Sheet visible={visible} onClose={close} closeLabel={t("common.close")}>
      <View style={{ paddingHorizontal: 12, paddingTop: 4, gap: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            minHeight: 48,
            paddingHorizontal: 12,
            borderRadius: radius.control,
            backgroundColor: colors.surfaceSoft,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flexShrink: 1,
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: colors.textSecondary,
            }}
          >
            {label}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            testID="keypad-value"
            style={{ fontFamily: fonts.monoSemiBold, fontSize: 24, color: colors.gunmetal }}
          >
            <Text style={{ color: colors.textFaint }}>{zeros}</Text>
            {shown}
          </Text>
        </View>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 6 }}>
            {row}
          </View>
        ))}
      </View>
    </Sheet>
  );
}

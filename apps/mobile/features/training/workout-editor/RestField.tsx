import React from "react";
import { Text, View } from "react-native";
import { clamp, clock, parseSeconds } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { NumberField } from "../components/NumberField";
import { type } from "../type";

export type RestFieldProps = {
  label: string;
  /** None at zero, which shows blank. */
  seconds: number;
  onChange: (seconds: number) => void;
  /** On a soft tile of its own, rather than a line inside a card. */
  soft?: boolean;
};

/** A rest typed as seconds or m:ss; blank is no rest. */
export function RestField({
  label,
  seconds,
  onChange,
  soft = false,
}: RestFieldProps): React.ReactElement {
  return (
    <View
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        ...(soft ? { paddingLeft: 12, borderRadius: 12, backgroundColor: colors.surfaceSoft } : {}),
      }}
    >
      <Text style={[type.body, { flex: 1, fontSize: 14, color: colors.gunmetal }]}>{label}</Text>
      <NumberField
        value={seconds > 0 ? clock(seconds) : ""}
        onCommit={(text) => {
          const typed = text.trim() === "" ? 0 : parseSeconds(text, "s");
          if (typed !== null) onChange(clamp(Math.round(typed), 0, 3600));
        }}
        label={label}
        placeholder="–"
        keyboard="numbers-and-punctuation"
        style={{
          minWidth: 72,
          height: 44,
          textAlign: "right",
          fontSize: 14,
          color: colors.gunmetal,
        }}
      />
    </View>
  );
}

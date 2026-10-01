import React from "react";
import { Text, View } from "react-native";
import { clamp, parseNumber, parseSeconds, secondsText, type TimeUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Stepper } from "../../components/Stepper";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import type { FieldSpec } from "./fields";
import { TimeUnitToggle } from "./TimeUnitToggle";

export type BuilderFieldProps = {
  spec: FieldSpec;
  value: number;
  unit: TimeUnit;
  hint: string | null;
  onChange: (value: number) => void;
  onUnit: (unit: TimeUnit) => void;
};

/** One protocol number: − / typed value / +, with sec | min for times. */
export function BuilderField({
  spec,
  value,
  unit,
  hint,
  onChange,
  onUnit,
}: BuilderFieldProps): React.ReactElement {
  const c = useTheme();
  const label = t(spec.label);
  const fit = (n: number): number => clamp(Math.round(n), spec.min, spec.max);
  const step = spec.time && unit === "min" ? 60 : 1;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: c.lineDark,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: c.onDark }]}>{label}</Text>
        {spec.time && <TimeUnitToggle unit={unit} onUnit={onUnit} />}
        {hint !== null && (
          <Text style={[type.body, { fontSize: 12, color: c.onDark3 }]}>{hint}</Text>
        )}
      </View>
      <Stepper
        value={spec.time ? secondsText(value, unit) : String(value)}
        onCommit={(text) => {
          const n = spec.time ? parseSeconds(text, unit) : parseNumber(text);
          if (n !== null) onChange(fit(n));
        }}
        onStep={(dir) => onChange(fit(value + dir * step))}
        label={label}
        decreaseLabel={t("hang.decrease", { field: label.toLowerCase() })}
        increaseLabel={t("hang.increase", { field: label.toLowerCase() })}
        surface="dark"
        buttonSize={40}
        inputWidth={84}
        fontSize={18}
        keyboard={spec.time ? "numbers-and-punctuation" : "number-pad"}
      />
    </View>
  );
}

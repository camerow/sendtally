import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  CIRCUIT_COLOURS,
  circuitLabel,
  circuitMiddle,
  colourName,
  gradeLabel,
  MAX_CIRCUIT_GRADE,
  withCircuitRange,
  type Circuit,
  type GymScale,
} from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { OptionRow } from "../../components/OptionRow";
import { SelectRow } from "../../components/SelectRow";
import { press } from "../../lib/press";

const grades = Array.from({ length: MAX_CIRCUIT_GRADE + 1 }, (_, v) => v);

function GradeSelect({
  label,
  value,
  scale,
  onChange,
}: {
  label: string;
  value: number;
  scale: GymScale;
  onChange: (v: number) => void;
}): React.ReactElement {
  return (
    <View style={{ width: 92 }}>
      <SelectRow label={label} value={gradeLabel(value, scale)} valueFont={fonts.monoSemiBold}>
        {(close) =>
          grades.map((v) => (
            <OptionRow
              key={v}
              label={gradeLabel(v, scale)}
              selected={v === value}
              onPress={() => {
                onChange(v);
                close();
              }}
            />
          ))
        }
      </SelectRow>
    </View>
  );
}

export function CircuitRow({
  circuit,
  scale,
  onChange,
  onRemove,
}: {
  circuit: Circuit;
  scale: GymScale;
  onChange: (circuit: Circuit) => void;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <View
      style={{
        gap: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 62 }}>
          <SelectRow
            label={t("gyms.colour")}
            value=""
            leading={<CircuitDot colour={circuit.colour} size={18} />}
            style={{ paddingLeft: 11, paddingRight: 15 }}
          >
            {(close) =>
              CIRCUIT_COLOURS.map((colour) => (
                <OptionRow
                  key={colour}
                  label={colourName(colour)}
                  mono={false}
                  selected={colour === circuit.colour}
                  leading={<CircuitDot colour={colour} size={16} />}
                  onPress={() => {
                    onChange({ ...circuit, colour });
                    close();
                  }}
                />
              ))
            }
          </SelectRow>
        </View>
        <TextInput
          value={circuit.label}
          placeholder={colourName(circuit.colour)}
          placeholderTextColor={colors.textFaint}
          autoCorrect={false}
          autoComplete="off"
          maxLength={40}
          accessibilityLabel={t("gyms.circuit")}
          onChangeText={(label) => onChange({ ...circuit, label })}
          style={{
            flex: 1,
            height: 46,
            fontFamily: fonts.sansSemiBold,
            fontSize: 15,
            color: colors.gunmetal,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: "rgba(64,63,76,0.15)",
            borderRadius: radius.control,
            paddingHorizontal: 13,
          }}
        />
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("gyms.removeCircuit")}
          style={press({ width: 32, height: 46, alignItems: "center", justifyContent: "center" })}
        >
          <Icon name="x" color={colors.textFaint} size={16} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <GradeSelect
          label={t("gyms.from")}
          value={circuit.low}
          scale={scale}
          onChange={(v) => onChange(withCircuitRange(circuit, "low", v))}
        />
        <GradeSelect
          label={t("gyms.to")}
          value={circuit.high}
          scale={scale}
          onChange={(v) => onChange(withCircuitRange(circuit, "high", v))}
        />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.textMuted,
          }}
        >
          {t("gyms.scoredAs", { grade: gradeLabel(circuitMiddle(circuit), scale) })} ·{" "}
          {circuitLabel(circuit)}
        </Text>
      </View>
    </View>
  );
}

import React from "react";
import { Pressable, Text, View } from "react-native";
import { circuitLabel, circuitRangeLabel, type Gym } from "@sendtally/features/gyms";
import {
  climbGradingValue,
  climbKindOf,
  disciplineLabel,
  withClimbGrading,
  type ClimbDraft,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { SelectRow } from "../../components/SelectRow";
import { climbKindStorage } from "../../lib/climbKindStorage";
import { pressRow } from "../../lib/press";

type Option = { value: string; label: string; hint: string; dot: React.ReactNode };

export type ClimbKindPickerProps = {
  climb: ClimbDraft;
  gym: Gym;
  prefs: GradePrefs;
  onChange: (climb: ClimbDraft) => void;
};

/** Boulder, route, or one of the gym's circuits; the pick is remembered for the next climb. */
export function ClimbKindPicker({
  climb,
  gym,
  prefs,
  onChange,
}: ClimbKindPickerProps): React.ReactElement {
  const options: Option[] = [
    ...(["boulder", "route"] as const).map((d) => ({
      value: d,
      label: disciplineLabel(d),
      hint: "",
      dot: null,
    })),
    ...gym.circuits.map((c) => ({
      value: c.id,
      label: circuitLabel(c),
      hint: circuitRangeLabel(c, gym.scale),
      dot: <CircuitDot colour={c.colour} size={14} />,
    })),
  ];
  const value = climbGradingValue(climb);
  const current = options.find((o) => o.value === value);

  return (
    <SelectRow
      label={t("logSession.climbKind")}
      value={current?.label ?? climb.circuit?.label ?? ""}
      leading={
        current?.dot ??
        (climb.circuit === undefined ? null : (
          <CircuitDot colour={climb.circuit.colour} size={14} />
        ))
      }
    >
      {(close) =>
        options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                const next = withClimbGrading(climb, option.value, prefs, gym);
                climbKindStorage.write(climbKindOf(next));
                onChange(next);
                close();
              }}
              style={pressRow({
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 12,
                borderRadius: radius.control,
                backgroundColor: selected ? "rgba(249,220,92,0.35)" : "transparent",
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {option.dot}
                <Text
                  style={{
                    fontFamily: selected ? fonts.sansSemiBold : fonts.sansMedium,
                    fontSize: 15,
                    color: colors.gunmetal,
                  }}
                >
                  {option.label}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text
                  style={{ fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textMuted }}
                >
                  {option.hint}
                </Text>
                {selected && (
                  <Icon name="check" color={colors.gunmetal} size={18} strokeWidth={2.2} />
                )}
              </View>
            </Pressable>
          );
        })
      }
    </SelectRow>
  );
}

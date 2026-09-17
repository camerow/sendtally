import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  circuitLabel,
  circuitRangeLabel,
  withCircuit,
  type Circuit,
  type Gym,
} from "@sendtally/features/gyms";
import {
  climbKindOf,
  disciplineLabel,
  gymOfCircuit,
  withClimbKind,
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
import { GradePicker } from "./GradePicker";

function Option({
  label,
  hint,
  selected,
  leading,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  leading?: React.ReactNode;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
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
        {leading}
        <Text
          style={{
            fontFamily: selected ? fonts.sansSemiBold : fonts.sansMedium,
            fontSize: 15,
            color: colors.gunmetal,
          }}
        >
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {hint !== undefined && (
          <Text style={{ fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textMuted }}>
            {hint}
          </Text>
        )}
        {selected && <Icon name="check" color={colors.gunmetal} size={18} strokeWidth={2.2} />}
      </View>
    </Pressable>
  );
}

export type ClimbKindPickerProps = {
  climb: ClimbDraft;
  gyms: readonly Gym[];
  prefs: GradePrefs;
  onChange: (climb: ClimbDraft) => void;
};

/** Boulder, route, or a gym's circuits; the pick is remembered for the next climb. */
export function ClimbKindPicker({
  climb,
  gyms,
  prefs,
  onChange,
}: ClimbKindPickerProps): React.ReactElement {
  const options = [
    ...(["boulder", "route"] as const).map((d) => ({ value: d, label: disciplineLabel(d) })),
    ...gyms.map((g) => ({ value: g.id, label: t("logSession.gymCircuits", { gym: g.name }) })),
  ];
  const value = climbKindOf(climb, gyms);
  return (
    <SelectRow
      label={t("logSession.climbKind")}
      value={options.find((o) => o.value === value)?.label ?? ""}
    >
      {(close) =>
        options.map((option) => (
          <Option
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => {
              const next = withClimbKind(climb, option.value, prefs, gyms);
              climbKindStorage.write(climbKindOf(next, gyms));
              onChange(next);
              close();
            }}
          />
        ))
      }
    </SelectRow>
  );
}

export type ClimbGradePickerProps = {
  climb: ClimbDraft;
  gyms: readonly Gym[];
  onChange: (climb: ClimbDraft) => void;
};

/** The grade ladder of the climb's scale, or the circuits of the gym it is at. */
export function ClimbGradePicker({
  climb,
  gyms,
  onChange,
}: ClimbGradePickerProps): React.ReactElement {
  const gym = gymOfCircuit(gyms, climb.circuit?.id);
  if (gym === null) return <GradePicker climb={climb} onChange={onChange} />;
  const current = gym.circuits.find((c) => c.id === climb.circuit?.id);
  const title = (c: Circuit): string => `${circuitLabel(c)} · ${circuitRangeLabel(c, gym.scale)}`;
  return (
    <SelectRow
      label={t("common.grade")}
      value={current === undefined ? "" : title(current)}
      valueFont={fonts.sansSemiBold}
      leading={current === undefined ? null : <CircuitDot colour={current.colour} size={14} />}
    >
      {(close) =>
        gym.circuits.map((c) => (
          <Option
            key={c.id}
            label={circuitLabel(c)}
            hint={circuitRangeLabel(c, gym.scale)}
            selected={c.id === current?.id}
            leading={<CircuitDot colour={c.colour} size={14} />}
            onPress={() => {
              onChange(withCircuit(climb, c, gym));
              close();
            }}
          />
        ))
      }
    </SelectRow>
  );
}

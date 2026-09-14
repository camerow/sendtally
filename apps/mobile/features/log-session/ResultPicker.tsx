import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  disciplineOf,
  sendStyleLabel,
  sendStylesFor,
  withClimbOutcome,
  type ClimbDraft,
  type ClimbOutcome,
  type ClimbStyle,
  type Discipline,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { SelectRow } from "../../components/SelectRow";
import { pressRow } from "../../lib/press";

type Option = { outcome: ClimbOutcome; label: string; hint: string; fill: string; ink: string };

const STYLE_FILL: Record<ClimbStyle, { fill: string; ink: string }> = {
  redpoint: { fill: colors.azureInk, ink: colors.white },
  flash: { fill: colors.gold, ink: colors.gunmetal },
  onsight: { fill: colors.petalInk, ink: colors.white },
};

const STYLE_HINT = {
  redpoint: "logSession.hintRedpoint",
  flash: "logSession.hintFlash",
  onsight: "logSession.hintOnsight",
} as const;

function optionsFor(discipline: Discipline): Option[] {
  const sends = sendStylesFor(discipline).map((style) => ({
    outcome: { kind: "send", style } as const,
    label: sendStyleLabel(discipline, style),
    hint: t(STYLE_HINT[style]),
    ...STYLE_FILL[style],
  }));
  return [
    ...sends,
    {
      outcome: { kind: "attempt" },
      label: t("logSession.attempt"),
      hint: t("logSession.hintAttempt"),
      fill: colors.gunmetal,
      ink: colors.white,
    },
  ];
}

function Mark({ option, size }: { option: Option; size: number }): React.ReactElement {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: option.fill,
      }}
    >
      {option.outcome.kind === "send" ? (
        <Icon name="check" color={option.ink} size={size - 8} strokeWidth={2.4} />
      ) : (
        <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: size - 10, color: option.ink }}>
          ✗
        </Text>
      )}
    </View>
  );
}

export type ResultPickerProps = {
  climb: ClimbDraft;
  onChange: (climb: ClimbDraft) => void;
};

/**
 * One field that names the result and opens a list to change it. A segmented control needs
 * REDPOINT · FLASH · ONSIGHT · ATTEMPT to fit side by side, which no phone width does.
 */
export function ResultPicker({ climb, onChange }: ResultPickerProps): React.ReactElement {
  const options = optionsFor(disciplineOf(climb.scale));
  const current =
    options.find(({ outcome }) =>
      outcome.kind === "attempt"
        ? climb.kind === "attempt"
        : climb.kind === "send" && climb.style === outcome.style
    ) ?? options[options.length - 1]!;

  return (
    <SelectRow
      label={t("common.result")}
      value={current.label}
      leading={<Mark option={current} size={22} />}
    >
      {(close) =>
        options.map((option) => {
          const selected = option === current;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                onChange(withClimbOutcome(climb, option.outcome));
                close();
              }}
              style={pressRow({
                height: 56,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 12,
                borderRadius: radius.control,
                backgroundColor: selected ? "rgba(27,98,206,0.08)" : "transparent",
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Mark option={option} size={24} />
                <Text
                  style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: colors.gunmetal }}
                >
                  {option.label}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 10,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: colors.textMuted,
                }}
              >
                {option.hint}
              </Text>
            </Pressable>
          );
        })
      }
    </SelectRow>
  );
}

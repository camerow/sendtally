import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  addLap,
  enduranceAmountLabel,
  enduranceLapLabel,
  enduranceLapValueLabel,
  enduranceOf,
  enduranceProgressLabel,
  enduranceStep,
  enduranceUnitLabel,
  isCleanLap,
  withEnduranceTarget,
  withEnduranceUnit,
  withLap,
  type ClimbDraft,
  type EnduranceUnit,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { SelectRow } from "../../components/SelectRow";
import { press, pressRow } from "../../lib/press";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

function Stepper({
  glyph,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  glyph: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={press({
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 17, color: colors.gunmetal }}>
        {glyph}
      </Text>
    </Pressable>
  );
}

/** A bare number between two buttons: a box around it reads as an input nobody can type into. */
function AmountStepper({
  value,
  down,
  up,
  atFloor,
  atCeiling,
  onDown,
  onUp,
}: {
  value: string;
  down: string;
  up: string;
  atFloor: boolean;
  atCeiling: boolean;
  onDown: () => void;
  onUp: () => void;
}): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Stepper glyph="−" accessibilityLabel={down} disabled={atFloor} onPress={onDown} />
      <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 15, color: colors.gunmetal }}>
        {value}
      </Text>
      <Stepper glyph="+" accessibilityLabel={up} disabled={atCeiling} onPress={onUp} />
    </View>
  );
}

function UnitToggle({
  value,
  onChange,
}: {
  value: EnduranceUnit;
  onChange: (unit: EnduranceUnit) => void;
}): React.ReactElement {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: "row",
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        overflow: "hidden",
      }}
    >
      {(["moves", "seconds"] as const).map((unit) => {
        const active = unit === value;
        return (
          <Pressable
            key={unit}
            onPress={() => onChange(unit)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={enduranceUnitLabel(unit)}
            hitSlop={{ top: 7, bottom: 7 }}
            style={press({
              height: 28,
              paddingHorizontal: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? "rgba(64,63,76,0.08)" : "transparent",
            })}
          >
            <Text
              style={{
                fontFamily: active ? fonts.monoSemiBold : fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: active ? colors.gunmetal : colors.textFaint,
              }}
            >
              {enduranceUnitLabel(unit)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Colour carries the outcome, border weight carries the selection. */
function LapChip({
  n,
  clean,
  value,
  selected,
  onPress,
}: {
  n: number;
  clean: boolean;
  value: string;
  selected: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${t("endurance.lapNumber", { n })}, ${clean ? t("endurance.completed") : value}`}
      style={press({
        width: clean ? 62 : 74,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        borderRadius: radius.control,
        borderWidth: selected ? 2 : 1,
        borderColor: clean ? colors.fern : colors.watermelonInk,
      })}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.7,
          color: colors.textSecondary,
        }}
      >
        {n}
      </Text>
      {clean ? (
        <Icon name="check" color={colors.fern} size={17} strokeWidth={2.4} />
      ) : (
        <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 14, color: colors.gunmetal }}>
          {value}
        </Text>
      )}
    </Pressable>
  );
}

function OutcomeMark({ clean }: { clean: boolean }): React.ReactElement {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: clean ? colors.fern : colors.gunmetal,
      }}
    >
      {clean ? (
        <Icon name="check" color={colors.white} size={12} strokeWidth={3} />
      ) : (
        <Icon name="x" color={colors.white} size={11} strokeWidth={3} />
      )}
    </View>
  );
}

export type EnduranceFieldsProps = {
  climb: ClimbDraft;
  onChange: (climb: ClimbDraft) => void;
};

/** What one lap is, what each lap came to, and the outcome of the lap being looked at. */
export function EnduranceFields({ climb, onChange }: EnduranceFieldsProps): React.ReactElement {
  const endurance = enduranceOf(climb);
  const [picked, setPicked] = React.useState(endurance.laps.length - 1);
  const selected = Math.min(picked, endurance.laps.length - 1);
  const step = enduranceStep(endurance.unit);
  const lap = endurance.laps[selected] ?? 0;
  const clean = isCleanLap(endurance, selected);

  const setLap = (done: number): void => onChange(withLap(climb, selected, done));

  return (
    <>
      <View style={{ gap: 9 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={label}>{t("endurance.oneLapIs")}</Text>
          <UnitToggle
            value={endurance.unit}
            onChange={(unit) => {
              setPicked(0);
              onChange(withEnduranceUnit(climb, unit));
            }}
          />
        </View>
        <AmountStepper
          value={enduranceAmountLabel(endurance, endurance.target)}
          down={t("endurance.shorterLap")}
          up={t("endurance.longerLap")}
          atFloor={endurance.target <= step}
          atCeiling={endurance.target >= 3600}
          onDown={() => onChange(withEnduranceTarget(climb, endurance.target - step))}
          onUp={() => onChange(withEnduranceTarget(climb, endurance.target + step))}
        />
      </View>

      <View style={{ gap: 9 }}>
        <View
          style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}
        >
          <Text style={label}>{t("endurance.laps")}</Text>
          <Text style={{ ...label, letterSpacing: 0.6 }}>{enduranceProgressLabel(endurance)}</Text>
        </View>
        <View
          accessibilityRole="radiogroup"
          style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
        >
          {endurance.laps.map((_, i) => (
            <LapChip
              key={i}
              n={i + 1}
              clean={isCleanLap(endurance, i)}
              value={enduranceLapValueLabel(endurance, i)}
              selected={i === selected}
              onPress={() => setPicked(i)}
            />
          ))}
          <Pressable
            onPress={() => {
              setPicked(endurance.laps.length);
              onChange(addLap(climb));
            }}
            accessibilityRole="button"
            accessibilityLabel={t("endurance.addLap")}
            style={press({
              flexGrow: 1,
              minWidth: 74,
              height: 60,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.control,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.lineOnLightStrong,
            })}
          >
            <Text
              style={{
                fontFamily: fonts.monoSemiBold,
                fontSize: 11,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: colors.gunmetal,
              }}
            >
              {t("endurance.addLap")}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ gap: 9 }}>
        <Text style={label}>{t("endurance.lapNumber", { n: selected + 1 })}</Text>
        <SelectRow
          label={t("endurance.lapNumber", { n: selected + 1 })}
          value={clean ? t("endurance.completed") : t("endurance.fellAfter")}
          leading={<OutcomeMark clean={clean} />}
        >
          {(close) =>
            [true, false].map((option) => (
              <Pressable
                key={String(option)}
                accessibilityRole="radio"
                accessibilityState={{ checked: option === clean }}
                onPress={() => {
                  setLap(option ? endurance.target : Math.max(0, endurance.target - step));
                  close();
                }}
                style={pressRow({
                  height: 56,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 12,
                  borderRadius: radius.control,
                  backgroundColor: option === clean ? "rgba(27,98,206,0.08)" : "transparent",
                })}
              >
                <OutcomeMark clean={option} />
                <Text
                  style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: colors.gunmetal }}
                >
                  {option ? t("endurance.completed") : t("endurance.fellAfter")}
                </Text>
              </Pressable>
            ))
          }
        </SelectRow>
        {!clean && (
          <AmountStepper
            value={enduranceLapLabel(endurance, selected)}
            down={t("endurance.lessOfTheLap")}
            up={t("endurance.moreOfTheLap")}
            atFloor={lap <= 0}
            atCeiling={lap >= endurance.target}
            onDown={() => setLap(lap - step)}
            onUp={() => setLap(lap + step)}
          />
        )}
      </View>
    </>
  );
}

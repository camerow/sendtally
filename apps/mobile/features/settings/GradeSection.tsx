import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  disciplineLabel,
  scaleLabel,
  scaleOptionsFor,
  type Discipline,
  type GradePrefs,
  type GradeScale,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";

export type GradeSectionProps = {
  prefs: GradePrefs;
  onChange: (discipline: Discipline, scale: GradeScale) => void;
};

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
      style={press({
        minWidth: 64,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 14,
        backgroundColor: active ? colors.gold : "transparent",
      })}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 11,
          letterSpacing: 0.6,
          color: active ? colors.gunmetal : "rgba(64,63,76,0.65)",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Row({
  discipline,
  prefs,
  onChange,
}: {
  discipline: Discipline;
  prefs: GradePrefs;
  onChange: (discipline: Discipline, scale: GradeScale) => void;
}): React.ReactElement {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        minHeight: 44,
      }}
    >
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.gunmetal }}>
        {disciplineLabel(discipline)}
      </Text>
      <View
        style={{
          flexDirection: "row",
          height: 36,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: "rgba(64,63,76,0.18)",
          overflow: "hidden",
        }}
      >
        {scaleOptionsFor(discipline).map((scale) => (
          <Segment
            key={scale}
            label={scaleLabel(scale)}
            active={prefs[discipline] === scale}
            onPress={() => onChange(discipline, scale)}
          />
        ))}
      </View>
    </View>
  );
}

export function GradeSection({ prefs, onChange }: GradeSectionProps): React.ReactElement {
  return (
    <View style={sectionCard}>
      <Text style={sectionLabel}>{t("settings.grades")}</Text>
      <Text style={bodyText}>{t("settings.gradesBody")}</Text>
      <Row discipline="boulder" prefs={prefs} onChange={onChange} />
      <View style={{ borderTopWidth: 1, borderTopColor: colors.lineOnLight }} />
      <Row discipline="route" prefs={prefs} onChange={onChange} />
    </View>
  );
}

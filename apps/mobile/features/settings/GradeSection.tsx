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
import { Icon } from "../../components/Icon";
import { SelectRow } from "../../components/SelectRow";
import { pressRow } from "../../lib/press";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";

export type GradeSectionProps = {
  prefs: GradePrefs;
  onChange: (discipline: Discipline, scale: GradeScale) => void;
};

function Row({
  discipline,
  prefs,
  onChange,
}: {
  discipline: Discipline;
  prefs: GradePrefs;
  onChange: (discipline: Discipline, scale: GradeScale) => void;
}): React.ReactElement {
  const label = disciplineLabel(discipline);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <Text
        style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.gunmetal }}
      >
        {label}
      </Text>
      <View style={{ width: 140 }}>
        <SelectRow
          label={label}
          value={scaleLabel(prefs[discipline])}
          valueFont={fonts.monoSemiBold}
        >
          {(close) =>
            scaleOptionsFor(discipline).map((scale) => {
              const selected = scale === prefs[discipline];
              return (
                <Pressable
                  key={scale}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    onChange(discipline, scale);
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
                  <Text
                    style={{
                      fontFamily: selected ? fonts.monoSemiBold : fonts.monoMedium,
                      fontSize: 15,
                      color: colors.gunmetal,
                    }}
                  >
                    {scaleLabel(scale)}
                  </Text>
                  {selected && (
                    <Icon name="check" color={colors.gunmetal} size={18} strokeWidth={2.2} />
                  )}
                </Pressable>
              );
            })
          }
        </SelectRow>
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
      <Row discipline="route" prefs={prefs} onChange={onChange} />
    </View>
  );
}

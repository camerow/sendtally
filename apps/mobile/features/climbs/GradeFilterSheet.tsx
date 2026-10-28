import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbSummary, GradeScales } from "@sendtally/api-client";
import { typicalGradeIndex, type GradeFilter } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { disciplineLabel, disciplineOf, gradeOptions } from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";
import { GradeChips } from "../../components/GradeChips";
import { Segmented } from "../../components/Segmented";
import { Sheet } from "../../components/Sheet";
import { press } from "../../lib/press";
import { primaryButton, primaryButtonLabel } from "../../lib/styles";

export type GradeFilterSheetProps = {
  visible: boolean;
  value: GradeFilter | null;
  scales: GradeScales;
  climbs: readonly ClimbSummary[];
  onChange: (filter: GradeFilter | null) => void;
  onClose: () => void;
};

const label = {
  paddingHorizontal: 18,
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

/** Boulder or route, then a from and a to on the grade chips Add climb uses. */
export function GradeFilterSheet({
  visible,
  value,
  scales,
  climbs,
  onChange,
  onClose,
}: GradeFilterSheetProps): React.ReactElement {
  const [discipline, setDiscipline] = React.useState(
    value === null ? "boulder" : disciplineOf(value.scale)
  );
  const scale = value?.scale ?? scales[discipline];
  const chips = gradeOptions(scale).map((g) => ({ key: g, label: g }));
  const start = typicalGradeIndex([...climbs], scale);
  const end = (key: "from" | "to", grade: string): void =>
    onChange({
      scale,
      from: key === "from" ? grade : (value?.from ?? grade),
      to: key === "to" ? grade : (value?.to ?? grade),
    });

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      closeLabel={t("common.close")}
      footer={
        <Pressable onPress={onClose} accessibilityRole="button" style={press({ ...primaryButton })}>
          <Text style={primaryButtonLabel}>{t("common.done")}</Text>
        </Pressable>
      }
    >
      <View style={{ gap: 14, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 18,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{ fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.gunmetal }}
          >
            {t("common.grade")}
          </Text>
          {value !== null && (
            <Pressable
              onPress={() => onChange(null)}
              accessibilityRole="button"
              hitSlop={10}
              style={press({})}
            >
              <Text
                style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.azureInk }}
              >
                {t("common.clear")}
              </Text>
            </Pressable>
          )}
        </View>
        <View style={{ paddingHorizontal: 18 }}>
          <Segmented
            soft
            label={t("climbs.discipline")}
            segments={(["boulder", "route"] as const).map((d) => ({
              key: d,
              label: disciplineLabel(d),
              on: d === discipline,
              onPress: () => {
                setDiscipline(d);
                if (d !== discipline) onChange(null);
              },
            }))}
          />
        </View>
        <Text style={label}>{t("climbs.from")}</Text>
        <GradeChips
          light
          chips={chips}
          active={value?.from ?? null}
          startIndex={start}
          onPick={(g) => end("from", g)}
        />
        <Text style={label}>{t("climbs.to")}</Text>
        <GradeChips
          light
          chips={chips}
          active={value?.to ?? null}
          startIndex={start}
          onPick={(g) => end("to", g)}
        />
      </View>
    </Sheet>
  );
}

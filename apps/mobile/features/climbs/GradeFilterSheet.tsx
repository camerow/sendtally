import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbSummary, GradeScales } from "@sendtally/api-client";
import {
  climbGradeBins,
  gradeFilterOf,
  gradeRangeOf,
  type GradeFilter,
} from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { disciplineLabel, disciplineOf } from "@sendtally/features/log-session";
import { gradeTap, presetsOf, type GradeRange } from "@sendtally/features/trends";
import { colors, fonts } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Segmented } from "../../components/Segmented";
import { Sheet } from "../../components/Sheet";
import { press } from "../../lib/press";
import { primaryButton, primaryButtonLabel } from "../../lib/styles";
import { GradeHistogram } from "./GradeHistogram";

export type GradeFilterSheetProps = {
  visible: boolean;
  value: GradeFilter | null;
  scales: GradeScales;
  climbs: readonly ClimbSummary[];
  onChange: (filter: GradeFilter | null) => void;
  onClose: () => void;
};

const same = (a: GradeRange | null, b: GradeRange | null): boolean =>
  a?.lo === b?.lo && a?.hi === b?.hi;

/** Boulder or route, then the user's climbs per grade: tap one grade, then another for a range. */
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
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const close = (): void => {
    setAnchor(null);
    onClose();
  };
  const scale = value?.scale ?? scales[discipline];
  const bins = climbGradeBins(climbs, scale);
  const range = value === null ? null : gradeRangeOf(value);
  const pick = (grade: GradeRange | null): void =>
    onChange(grade === null ? null : gradeFilterOf(scale, grade));
  const anchorLabel = bins.find((b) => b.rank === anchor)?.label;

  return (
    <Sheet
      visible={visible}
      onClose={close}
      closeLabel={t("common.close")}
      footer={
        <Pressable onPress={close} accessibilityRole="button" style={press({ ...primaryButton })}>
          <Text style={primaryButtonLabel}>{t("common.done")}</Text>
        </Pressable>
      }
    >
      <View style={{ gap: 14, paddingBottom: 8 }}>
        <Text
          accessibilityRole="header"
          style={{
            paddingHorizontal: 18,
            fontFamily: fonts.sansSemiBold,
            fontSize: 18,
            color: colors.gunmetal,
          }}
        >
          {t("common.grade")}
        </Text>
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
                if (d === discipline) return;
                setAnchor(null);
                onChange(null);
              },
            }))}
          />
        </View>
        {bins.length > 0 && (
          <>
            <Text
              style={{
                paddingHorizontal: 18,
                fontFamily: fonts.sans,
                fontSize: 13,
                color: colors.textSecondary,
              }}
            >
              {anchorLabel === undefined
                ? t("trends.gradeHelp")
                : t("trends.gradeHelpAnchor", { grade: anchorLabel })}
            </Text>
            <GradeHistogram
              bins={bins}
              range={range}
              onTap={(rank) => {
                const next = gradeTap(anchor, rank);
                setAnchor(next.anchor);
                pick(next.grade);
              }}
            />
          </>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 18 }}>
          {presetsOf(bins).map((p) => (
            <Chip
              key={p.key}
              label={p.label}
              active={same(p.grade, range)}
              uppercase={false}
              onPress={() => {
                setAnchor(null);
                pick(p.grade);
              }}
            />
          ))}
        </View>
      </View>
    </Sheet>
  );
}

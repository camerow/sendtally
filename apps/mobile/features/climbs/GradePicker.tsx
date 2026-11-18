import React from "react";
import { Text, View } from "react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  climbGradeBins,
  gradeFilterOf,
  gradeRangeOf,
  type GradeFilter,
} from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import type { GradeScale } from "@sendtally/features/log-session";
import { gradeTap, presetsOf, type GradeRange } from "@sendtally/features/trends";
import { colors, fonts } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { GradeHistogram } from "./GradeHistogram";

export type GradePickerProps = {
  scale: GradeScale;
  value: GradeFilter | null;
  climbs: readonly ClimbSummary[];
  onChange: (filter: GradeFilter | null) => void;
};

const same = (a: GradeRange | null, b: GradeRange | null): boolean =>
  a?.lo === b?.lo && a?.hi === b?.hi;

/** The climbs per grade on one scale: tap one grade, then another for a range; presets below. */
export function GradePicker({
  scale,
  value,
  climbs,
  onChange,
}: GradePickerProps): React.ReactElement {
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const bins = climbGradeBins(climbs, scale);
  const range = value === null ? null : gradeRangeOf(value);
  const pick = (grade: GradeRange | null): void =>
    onChange(grade === null ? null : gradeFilterOf(scale, grade));
  const anchorLabel = bins.find((b) => b.rank === anchor)?.label;

  return (
    <View style={{ gap: 14 }}>
      {bins.length > 0 && (
        <>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary }}>
            {anchorLabel === undefined
              ? t("trends.gradeHelp")
              : t("trends.gradeHelpAnchor", { grade: anchorLabel })}
          </Text>
          <View style={{ marginHorizontal: -18 }}>
            <GradeHistogram
              bins={bins}
              range={range}
              onTap={(rank) => {
                const next = gradeTap(anchor, rank);
                setAnchor(next.anchor);
                pick(next.grade);
              }}
            />
          </View>
        </>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
  );
}

import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import type { GradeClimbTarget, GradeClimbsVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { ExpandableRow } from "../../components/ExpandableRow";
import { ClimbLogRow } from "./ClimbLogRow";
import { GradeBadge } from "./GradeBadge";
import { sectionLabel } from "./sectionLabel";

const opener = (target: GradeClimbTarget | null): (() => void) | null => {
  if (target === null) return null;
  const { kind, id } = target;
  if (kind === "climb") return () => router.push({ pathname: "/climb/[id]", params: { id } });
  if (kind === "activity") return () => router.push({ pathname: "/activity/[id]", params: { id } });
  return () => router.push({ pathname: "/session/[fingerprint]", params: { fingerprint: id } });
};

/** Every grade tried with how many went; one grade at a time opens in place to list its climbs, its name lined up with the counts. */
export function ClimbsByGrade({
  grades,
  total,
}: {
  grades: readonly GradeClimbsVM[];
  /** Every climb under the grades. */
  total: number;
}): React.ReactElement {
  const [open, setOpen] = React.useState<string | null>(null);
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 6,
        }}
      >
        <Text accessibilityRole="header" style={sectionLabel}>
          {t("climbs.climbsByGrade")}
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSecondary }}>
          {t("common.climbCount", { count: total })}
        </Text>
      </View>
      {grades.map((g) => {
        const expanded = g.key === open;
        return (
          <ExpandableRow
            key={g.key}
            expanded={expanded}
            onToggle={() => setOpen(expanded ? null : g.key)}
            accessibilityLabel={`${g.gradeLabel}, ${g.split}`}
            indent={56}
            body={g.climbs.map((c) => (
              <ClimbLogRow key={c.key} row={c.row} showGrade={false} onPress={opener(c.target)} />
            ))}
          >
            <GradeBadge label={g.gradeLabel} onSoft={expanded} />
            <Text
              style={{ flex: 1, fontFamily: fonts.mono, fontSize: 12.5, color: colors.gunmetal }}
            >
              {g.split}
            </Text>
          </ExpandableRow>
        );
      })}
    </View>
  );
}

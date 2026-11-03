import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import type { GradeClimbTarget, GradeClimbsVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";
import { ClimbLogRow } from "./ClimbLogRow";
import { GradeBadge } from "./GradeBadge";
import { sectionLabel } from "./sectionLabel";

const GUTTER = 18;

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
}: {
  grades: readonly GradeClimbsVM[];
}): React.ReactElement {
  const [open, setOpen] = React.useState<string | null>(null);
  const total = grades.reduce(
    (n, g) => n + g.climbs.reduce((m, c) => m + (c.row.count ?? 1), 0),
    0
  );
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
          <React.Fragment key={g.key}>
            <Pressable
              onPress={() => setOpen(expanded ? null : g.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${g.gradeLabel}, ${g.split}`}
              style={pressRow({
                minHeight: 52,
                marginHorizontal: -GUTTER,
                paddingHorizontal: GUTTER,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.lineOnLightSoft,
                backgroundColor: expanded ? colors.surfaceSoft : undefined,
              })}
            >
              <GradeBadge label={g.gradeLabel} onSoft={expanded} />
              <Text
                style={{ flex: 1, fontFamily: fonts.mono, fontSize: 12.5, color: colors.gunmetal }}
              >
                {g.split}
              </Text>
              <View style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}>
                <Icon name="chevron" color={colors.textSecondary} size={18} />
              </View>
            </Pressable>
            {expanded && (
              <View style={{ paddingLeft: 56 }}>
                {g.climbs.map((c) => (
                  <ClimbLogRow
                    key={c.key}
                    row={c.row}
                    showGrade={false}
                    onPress={opener(c.target)}
                  />
                ))}
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

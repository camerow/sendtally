import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  TREND_SETTINGS,
  gradeTap,
  resetFilter,
  settingLabel,
  withPlace,
  withTag,
  type TrendsFeature,
  type TrendsVM,
} from "@sendtally/features/trends";
import { Sheet } from "../../components/Sheet";
import { press, pressRow } from "../../lib/press";
import { Segmented } from "./Segmented";
import { monoLabel } from "./styles";

const BAR_MAX = 70;

/** Grade, place and tags in one sheet; each change applies live behind it. */
export function RefineSheet({
  visible,
  feature,
  vm,
  onClose,
}: {
  visible: boolean;
  feature: TrendsFeature;
  vm: TrendsVM;
  onClose: () => void;
}): React.ReactElement {
  const { filter, setFilter } = feature;
  const [anchor, setAnchor] = React.useState<number | null>(null);
  const grade = filter.grade;
  const within = (rank: number): boolean =>
    grade === null || (rank >= grade.lo && rank <= grade.hi);
  const max = Math.max(1, ...vm.grades.map((b) => b.count));
  const anchorLabel = vm.grades.find((b) => b.rank === anchor)?.label;
  const gymId = vm.scope === "circuit" ? null : filter.gymId;

  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("trends.closeFilter")}>
      <View style={{ gap: 20, paddingHorizontal: 18, paddingBottom: 18 }}>
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              letterSpacing: -0.4,
              color: colors.gunmetal,
            }}
          >
            {t("trends.refineTitle")}
          </Text>
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            onPress={() => {
              setAnchor(null);
              setFilter(resetFilter);
            }}
          >
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.azureInk }}>
              {t("trends.reset")}
            </Text>
          </Pressable>
        </View>

        {vm.scope !== "all" && vm.grades.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={monoLabel}>
              {t("common.grade")} · {vm.gradeLabel ?? t("trends.anyGrade")}
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                lineHeight: 19,
                color: colors.textSecondary,
              }}
            >
              {anchorLabel === undefined
                ? t("trends.gradeHelp")
                : t("trends.gradeHelpAnchor", { grade: anchorLabel })}
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: BAR_MAX + 6 }}
            >
              {vm.grades.map((b) => (
                <Pressable
                  key={b.rank}
                  accessibilityRole="button"
                  accessibilityLabel={t("trends.gradeBin", {
                    grade: b.label,
                    climbs: t("common.climbCount", { count: b.count }),
                  })}
                  accessibilityState={{ selected: grade !== null && within(b.rank) }}
                  onPress={() => {
                    const next = gradeTap(anchor, b.rank);
                    setAnchor(next.anchor);
                    setFilter((f) => ({ ...f, grade: next.grade }));
                  }}
                  style={{ flex: 1, height: "100%", justifyContent: "flex-end" }}
                >
                  <View
                    style={{
                      height:
                        b.count === 0 ? 2 : Math.max(3, Math.round((b.count / max) * BAR_MAX)),
                      borderTopLeftRadius: 3,
                      borderTopRightRadius: 3,
                      backgroundColor: within(b.rank) ? colors.azure : "rgba(64,63,76,0.16)",
                      borderWidth: anchor === b.rank ? 2 : 0,
                      borderColor: colors.gunmetal,
                    }}
                  />
                </Pressable>
              ))}
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 3,
                paddingTop: 5,
                borderTopWidth: 1,
                borderTopColor: "rgba(64,63,76,0.14)",
              }}
            >
              {vm.grades.map((b) => (
                <Text
                  key={b.rank}
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontFamily: grade !== null && within(b.rank) ? fonts.monoSemiBold : fonts.mono,
                    fontSize: 9,
                    color:
                      grade !== null && within(b.rank) ? colors.gunmetal : colors.textSecondary,
                  }}
                >
                  {b.label}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {vm.presets.map((p) => (
                <Pressable
                  key={p.key}
                  accessibilityRole="button"
                  onPress={() => {
                    setAnchor(null);
                    setFilter((f) => ({ ...f, grade: p.grade }));
                  }}
                  style={press({
                    height: 36,
                    paddingHorizontal: 12,
                    justifyContent: "center",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.lineOnLightStrong,
                  })}
                >
                  <Text
                    style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.gunmetal }}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={monoLabel}>{t("trends.place")}</Text>
          <Segmented
            soft
            label={t("trends.insideOrOutside")}
            segments={TREND_SETTINGS.map((s) => ({
              key: s,
              label: settingLabel(s),
              on: gymId === null && filter.setting === s,
              onPress: () => setFilter((f) => withPlace(f, s, null)),
            }))}
          />
          {vm.gyms.map((g) => {
            const on = gymId === g.id;
            return (
              <Pressable
                key={g.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setFilter((f) => withPlace(f, "all", on ? null : g.id))}
                style={pressRow({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 44,
                  paddingHorizontal: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.lineOnLightSoft,
                })}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: on ? 6 : 1.5,
                    borderColor: on ? colors.azureInk : "rgba(64,63,76,0.35)",
                  }}
                />
                <Text
                  style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.gunmetal }}
                >
                  {g.name}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}>
                  {g.sessions}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {vm.tags.length > 0 && (
          <View style={{ gap: 2 }}>
            <Text style={{ ...monoLabel, marginBottom: 6 }}>{t("common.tags")}</Text>
            {vm.tags.map((g) => {
              const on = filter.tags.includes(g.slug);
              return (
                <Pressable
                  key={g.slug}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => setFilter((f) => withTag(f, g.slug))}
                  style={pressRow({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 44,
                    paddingHorizontal: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.lineOnLightSoft,
                  })}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      borderWidth: 1.5,
                      borderColor: on ? colors.azureInk : "rgba(64,63,76,0.35)",
                      backgroundColor: on ? colors.azureInk : colors.white,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: fonts.sans,
                      fontSize: 15,
                      color: colors.gunmetal,
                    }}
                  >
                    {g.name}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}
                  >
                    {g.sessions}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={press({
            height: 50,
            borderRadius: radius.control + 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.gunmetal,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
            {t("trends.showSessions", { count: vm.sessions })}
          </Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

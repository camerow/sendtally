import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  PREVIEW_TREND_RANGE,
  TREND_RANGES,
  TREND_SCOPES,
  isRefined,
  refineSummary,
  scopeLabel,
  trendRangeLabel,
  useTrends,
  withScope,
} from "@sendtally/features/trends";
import { Chip } from "../../components/Chip";
import { useApi } from "../../lib/api";
import { press } from "../../lib/press";
import { Paywall } from "../billing/Paywall";
import { RefineSheet } from "./RefineSheet";
import { ScaleGymSheet } from "./ScaleGymSheet";
import { Segmented } from "./Segmented";
import { TrendSection } from "./TrendSection";
import { TrendStats } from "./TrendStats";

export type TrendsListProps = {
  preview?: boolean;
  onLockedRange?: () => void;
};

export function TrendsList({
  preview = false,
  onLockedRange,
}: TrendsListProps): React.ReactElement {
  const api = useApi();
  const feature = useTrends(api, { preview });
  const { state, filter, setFilter } = feature;
  const [sheet, setSheet] = React.useState<"refine" | "gyms" | null>(null);

  if (state.status === "loading") return <ActivityIndicator color={colors.gunmetal} />;
  if (state.status === "error") {
    return (
      <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
        {t("trends.loadFailedPull")}
      </Text>
    );
  }
  const vm = state.data;
  const scaleGym =
    vm.scope === "circuit" ? vm.scaleGyms.find((g) => g.id === filter.gymId) : undefined;
  const refined = isRefined(filter);

  return (
    <>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: colors.textSecondary,
        }}
      >
        {vm.sessionsLine}
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        }}
      >
        {vm.insight}
      </Text>
      <Segmented
        label={t("common.discipline")}
        segments={[
          ...TREND_SCOPES.map((s) => ({
            key: s,
            label: scopeLabel(s),
            on: vm.scope === s,
            onPress: () => setFilter((f) => withScope(f, s)),
          })),
          ...(vm.scaleGyms.length === 0
            ? []
            : [
                {
                  key: "more",
                  label: scaleGym?.name ?? t("trends.scopeMore"),
                  on: scaleGym !== undefined,
                  onPress: () => setSheet("gyms"),
                  lead:
                    scaleGym === undefined ? undefined : (
                      <View style={{ flexDirection: "row", gap: 2 }}>
                        {scaleGym.ladder.slice(0, 4).map((c) => (
                          <View
                            key={c.id}
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 4,
                              backgroundColor: CIRCUIT_HEX[c.colour],
                            }}
                          />
                        ))}
                      </View>
                    ),
                },
              ]),
        ]}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -18 }}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 18 }}
      >
        {TREND_RANGES.map((r) => {
          const locked = preview && r !== PREVIEW_TREND_RANGE;
          return (
            <Chip
              key={r}
              label={trendRangeLabel(r)}
              active={filter.range === r}
              locked={locked}
              onPress={() => (locked ? onLockedRange?.() : setFilter((f) => ({ ...f, range: r })))}
            />
          );
        })}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={() => setSheet("refine")}
        style={press({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          minHeight: 48,
          paddingHorizontal: 14,
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: refined ? "#E8C53A" : colors.lineOnLightStrong,
          backgroundColor: refined ? "rgba(249,220,92,0.22)" : colors.white,
        })}
      >
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}
        >
          {refineSummary(filter, vm.gradeLabel, vm.gyms, vm.tags)}
        </Text>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.gunmetal,
          }}
        >
          {t("trends.refine")}
        </Text>
      </Pressable>
      {vm.stats !== null && <TrendStats stats={vm.stats} />}
      {vm.groups.map((g) => (
        <TrendSection key={g.id} group={g} locked={preview} onLocked={onLockedRange} />
      ))}
      {preview && <Paywall />}
      <RefineSheet
        visible={sheet === "refine"}
        feature={feature}
        vm={vm}
        onClose={() => setSheet(null)}
      />
      <ScaleGymSheet
        visible={sheet === "gyms"}
        gyms={vm.scaleGyms}
        selected={scaleGym?.id ?? null}
        onPick={(id) => {
          setFilter((f) => withScope(f, "circuit", id));
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </>
  );
}

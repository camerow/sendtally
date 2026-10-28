import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isPullSetup, setupsOf, type GripSetup } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { compareGrips, loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../../../components/BackButton";
import { pressRow } from "../../../lib/press";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { loadChange } from "../summary/summaryText";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import { SetupChips } from "./SetupChips";

const MIN_SHARE = 0.06;

/** Every grip's best completed load on one setup as a bar, heaviest first, with its change. */
export function CompareGripsScreen(): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const setups = setupsOf(model.sessions);
  const [picked, setPicked] = React.useState<GripSetup | null>(null);
  const setup = picked ?? setups[0];
  const rows = setup === undefined ? [] : compareGrips(model.sessions, setup, model.gripName);
  const kind = setup !== undefined && isPullSetup(setup) ? "pull" : "hang";
  const bests = rows.map((r) => r.bestKg);
  const lo = Math.min(0, ...bests);
  const span = Math.max(...bests) - lo || 1;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 6 }}>
        <BackButton />
      </View>
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingTop: 8, paddingHorizontal: 18, paddingBottom: 24 }}
      >
        <View style={{ gap: 8 }}>
          <Label color={KIND_LOOK.hangboard.ink}>{t("statistics.hangboard")}</Label>
          <Title size={38}>{t("hang.compareGrips")}</Title>
        </View>
        {setups.length > 1 && (
          <SetupChips
            setups={setups}
            picked={setup ?? null}
            onPick={(s) => setPicked(s)}
            withAll={false}
          />
        )}
        {rows.length === 0 ? (
          <DashedPanel body={setups.length === 0 ? t("hang.trendsNone") : t("hang.compareEmpty")} />
        ) : (
          <View style={{ gap: 4 }}>
            {rows.map((r) => {
              const best = loadLabel(kind, r.bestKg, unit);
              const change = loadChange(r.changeKg, unit);
              return (
                <Pressable
                  key={r.gripId}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.name}, ${best}, ${change}`}
                  onPress={() => router.push({ pathname: "/grip/[id]", params: { id: r.gripId } })}
                  style={pressRow({ gap: 6, paddingVertical: 8 })}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                    <Text
                      numberOfLines={1}
                      style={[type.bodyBold, { flex: 1, fontSize: 14, color: colors.gunmetal }]}
                    >
                      {r.name}
                    </Text>
                    <Text style={[type.monoBold, { fontSize: 13, color: colors.gunmetal }]}>
                      {best}
                    </Text>
                    <Text
                      style={[
                        type.mono,
                        { width: 64, textAlign: "right", fontSize: 12, color: colors.textMuted },
                      ]}
                    >
                      {change}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.lineOnLightSoft,
                    }}
                  >
                    <View
                      style={{
                        height: 10,
                        borderRadius: 5,
                        width: `${Math.round(Math.max(MIN_SHARE, (r.bestKg - lo) / span) * 100)}%`,
                        backgroundColor: KIND_LOOK.hangboard.ink,
                      }}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

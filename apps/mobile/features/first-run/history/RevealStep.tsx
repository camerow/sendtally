import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { colors, fonts } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import { disciplineLabel } from "@sendtally/features/log-session";
import { revealLine } from "@sendtally/features/settings";
import { useTween } from "@sendtally/features/trends";
import { Icon } from "../../../components/Icon";
import { Pyramid } from "../../../components/Pyramid";
import { PyramidLegend } from "../../../components/PyramidLegend";
import { Button } from "../../training/components/Button";
import { darkLabel, darkMeta } from "../components/DarkCard";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { DarkTile } from "./components/DarkTile";
import { HardestSend } from "./components/HardestSend";
import { YearBars } from "./components/YearBars";
import { useHistoryCard } from "./useHistoryCard";

/** H4: everything brought in, as one picture on the dark ground; the count runs up and the pyramid grows. */
export function RevealStep({ wizard, api }: Parameters<StepComponent>[0]): React.ReactElement {
  const vm = useHistoryCard(api);
  const imported = wizard.memory.way === "import";
  const count = vm === null ? null : imported ? vm.stats.sends : vm.climbs;
  const [run, setRun] = React.useState(false);
  const counted = useTween(run ? count : null, 900);
  const grow = useSharedValue(0);
  const seen = React.useRef(false);

  React.useEffect(() => {
    if (vm === null || seen.current) return;
    seen.current = true;
    setRun(true);
    grow.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    wizard.capture("onboarding_reveal_viewed", {
      path: "history",
      sessions: vm.sessions,
      climbs: vm.climbs,
      sends: vm.stats.sends,
    });
  }, [vm, grow, wizard]);

  return (
    <WizardFrame
      wizard={wizard}
      dark
      skip={false}
      footer={
        <Button
          variant="plain"
          height={54}
          label={t("onboarding.firstRun.continue")}
          onPress={() => wizard.next()}
          style={{ backgroundColor: colors.gold }}
        />
      }
    >
      {vm === null ? (
        <ActivityIndicator color={colors.gold} style={{ alignSelf: "flex-start" }} />
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <Text style={darkLabel}>{t("onboarding.history.card.soFar")}</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
              <Text
                style={{
                  fontFamily: fonts.displayHeavy,
                  fontSize: 64,
                  lineHeight: 66,
                  letterSpacing: -2.5,
                  color: colors.white,
                }}
              >
                {formatNumber(Math.round(counted ?? 0))}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.displayHeavy,
                  fontSize: 24,
                  letterSpacing: -1,
                  color: colors.white,
                }}
              >
                {imported
                  ? t("climbs.sendsWord", { count: vm.stats.sends })
                  : t("onboarding.history.reveal.climbsWord", { count: vm.climbs })}
              </Text>
            </View>
            <Text style={darkMeta}>{revealLine(vm, imported)}</Text>
          </View>
          {vm.stats.pyramid.length > 0 && (
            <View style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={darkLabel}>{t("climbs.sendsByGrade")}</Text>
                <PyramidLegend dark inner={t("common.sent")} outer={t("sessionDetail.notYet")} />
              </View>
              <Pyramid
                tone="dark"
                grow={grow}
                rows={vm.stats.pyramid}
                label={vm.stats.pyramid.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
              />
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <DarkTile value={vm.stats.avgSend} label={t("climbs.avgSendWord")} />
            {imported ? (
              <DarkTile
                value={vm.days}
                label={t("onboarding.history.card.daysWord", { count: vm.days })}
              />
            ) : (
              <DarkTile
                value={vm.stats.sends}
                label={t("climbs.sendsWord", { count: vm.stats.sends })}
              />
            )}
            <DarkTile value={vm.stats.flashed} label={t("climbs.flashedWord")} />
            <DarkTile
              value={vm.stats.projects}
              label={t("climbs.projectsWord", { count: vm.stats.projects })}
            />
          </View>
          {vm.stats.hardest !== null && (
            <HardestSend
              gradeLabel={vm.stats.hardest.gradeLabel}
              name={vm.stats.hardest.name ?? disciplineLabel(vm.discipline)}
              year={vm.hardestYear}
            />
          )}
          {vm.byYear.length >= 2 && <YearBars years={vm.byYear} />}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="insights" size={18} strokeWidth={2.2} color={colors.gold} />
            <Text style={[darkMeta, { flex: 1 }]}>
              {t("onboarding.history.reveal.livesOnStats")}
            </Text>
          </View>
        </>
      )}
    </WizardFrame>
  );
}

import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { gripSeries, setupsOf, summarise, type GripSetup } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  gripSessionRows,
  gripSetupLabel,
  gripTiles,
  milestoneRows,
} from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../../../components/BackButton";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { SummaryTiles } from "../summary/SummaryTiles";
import { KIND_LOOK } from "../today/kindLook";
import { TrendCard } from "../trends/TrendCard";
import { insight } from "../trends/trendText";
import { type } from "../type";
import { GripSessions } from "./GripSessions";
import { Milestones } from "./Milestones";
import { SetupChips } from "./SetupChips";

export type GripScreenProps = { id: string };

/** One grip across every workout: its load on a setup, its milestones and every session on it. */
export function GripScreen({ id }: GripScreenProps): React.ReactElement {
  const { model, today } = useHangData();
  const unit = model.settings.units;
  const setups = setupsOf(model.sessions, id);
  const [picked, setPicked] = React.useState<GripSetup | null | undefined>(undefined);
  const setup = picked === undefined ? (setups[0] ?? null) : picked;
  const series = gripSeries(model.sessions, id, setup ?? undefined);
  const summary = summarise(series, today);
  const name = model.gripName(id);
  const kind = series[0]?.protocol.kind ?? "hang";
  const caption = setup === null ? t("hang.mixedSetups") : gripSetupLabel(setup);
  const said =
    summary === null || setup === null
      ? ""
      : insight(summary, { workout: name, grip: caption, kind, unit });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 6 }}>
        <BackButton />
      </View>
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingTop: 8, paddingHorizontal: 18, paddingBottom: 24 }}
      >
        <View style={{ gap: 8 }}>
          <Label color={KIND_LOOK.hangboard.ink}>{t("hang.gripKicker")}</Label>
          <Title size={38}>{name}</Title>
        </View>
        {setups.length > 1 && (
          <SetupChips setups={setups} picked={setup} onPick={setPicked} withAll />
        )}
        {summary === null ? (
          <DashedPanel body={t("hang.trendsNone")} />
        ) : (
          <>
            <TrendCard
              name={name}
              caption={caption}
              series={series}
              summary={summary}
              kind={kind}
              unit={unit}
            />
            <SummaryTiles stats={gripTiles(series, summary, unit)} />
            {said !== "" && (
              <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: colors.gunmetal }]}>
                {said}
              </Text>
            )}
            <Milestones rows={milestoneRows(series, unit, setup === null)} />
            <GripSessions rows={gripSessionRows(series, model.sessions, unit)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

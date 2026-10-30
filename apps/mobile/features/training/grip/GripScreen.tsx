import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { gripSeries, setupsOf, summarise, type GripSetup } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  canCompareGrips,
  gripSessionRows,
  gripSetupLabel,
  gripTiles,
  milestoneRows,
} from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { LinkRow } from "../../../components/LinkRow";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { DashedPanel } from "../components/DashedPanel";
import { DetailActions } from "../components/DetailActions";
import { deleteRow } from "../components/deleteRow";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import type { DetailMenuRow } from "../components/types";
import { useHangData } from "../data/HangDataContext";
import { openGripEditor } from "../exercises/openExerciseEditor";
import { CategoryMark } from "../library/CategoryMark";
import { useLibrary } from "../library/useLibrary";
import { SummaryTiles } from "../summary/SummaryTiles";
import { TrendCard } from "../trends/TrendCard";
import { insight } from "../trends/trendText";
import { type } from "../type";
import { GripSessions } from "./GripSessions";
import { Milestones } from "./Milestones";
import { SetupChips } from "./SetupChips";

export type GripScreenProps = { id: string };

/**
 * One Fingers exercise across every workout: its load on a setup, its milestones, every
 * session on it and the workouts that use it. Edit opens the exercise editor; ··· compares
 * it with the others or archives it.
 */
export function GripScreen({ id }: GripScreenProps): React.ReactElement {
  const { model, actions, today } = useHangData();
  const library = useLibrary().state;
  const unit = model.settings.units;
  const setups = setupsOf(model.sessions, id);
  const [picked, setPicked] = React.useState<GripSetup | null | undefined>(undefined);
  const setup = picked === undefined ? (setups[0] ?? null) : picked;
  const series = gripSeries(model.sessions, id, setup ?? undefined);
  const summary = summarise(series, today);
  const grip = model.grips.find((g) => g.id === id);
  const name = model.gripName(id);
  const kind = series[0]?.protocol.kind ?? "hang";
  const caption = setup === null ? t("hang.mixedSetups") : gripSetupLabel(setup);
  const said =
    summary === null || setup === null
      ? ""
      : insight(summary, { workout: name, grip: caption, kind, unit });
  const usedIn =
    library.status === "ready"
      ? library.data.workouts.filter(
          (w) => w.kind === "hangboard" && w.items.some((i) => i.exercise === id)
        )
      : [];

  const menu: DetailMenuRow[] = [];
  if (canCompareGrips(model.sessions))
    menu.push({
      icon: "insights",
      title: t("hang.compareGrips"),
      hint: t("hang.compareGripsHint"),
      onPress: () => router.push("/grip/compare"),
    });
  if (grip !== undefined && !grip.hidden)
    menu.push(
      deleteRow({
        title: t("workouts.archiveExercise"),
        hint: t("workouts.archiveExerciseBody"),
        confirm: {
          title: t("workouts.archiveExerciseTitle", { name }),
          body: t("workouts.archiveExerciseBody"),
          action: t("workouts.archiveExercise"),
        },
        onDelete: () => void actions.archiveGrip(grip),
      })
    );

  return (
    <ScreenFrame
      action={
        <DetailActions
          onEdit={grip === undefined ? undefined : () => openGripEditor(id)}
          menu={menu}
        />
      }
    >
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <CategoryMark kind="hangboard" size={28} />
          <Label color={colors.textSecondary}>{t("hang.gripKicker")}</Label>
        </View>
        <Title size={38}>{name}</Title>
      </View>
      {setups.length > 1 && (
        <SetupChips setups={setups} picked={setup} onPick={setPicked} withAll />
      )}
      {summary === null ? (
        <DashedPanel body={t("workouts.exerciseNothingLogged")} />
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
      {usedIn.length > 0 && (
        <View style={{ gap: 4 }}>
          <Label color={colors.gunmetal}>{t("workouts.usedIn")}</Label>
          {usedIn.map((w) => (
            <LinkRow
              key={w.id}
              label={w.name}
              onPress={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } })}
            />
          ))}
        </View>
      )}
    </ScreenFrame>
  );
}

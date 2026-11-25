import { router } from "expo-router";
import React from "react";
import { libraryPictures } from "@sendtally/features/library";
import { Text, View } from "react-native";
import { gripSeries, setupsOf, summarise, type GripSetup } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  canCompareGrips,
  gripDescription,
  gripSessionRows,
  gripSetupLabel,
  gripTiles,
  milestoneRows,
} from "@sendtally/features/hang";
import { kindLabel } from "@sendtally/features/activities";
import { workoutsWithGrip } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { LinkRow } from "../../../components/LinkRow";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Toast } from "../../../components/Toast";
import { AddToSheet } from "../components/AddToSheet";
import { DashedPanel } from "../components/DashedPanel";
import { DetailActions } from "../components/DetailActions";
import { Description } from "../components/Description";
import { archiveGripRow } from "../components/deleteRow";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import type { DetailMenuRow } from "../components/types";
import { useHangData } from "../data/HangDataContext";
import { pickedOf } from "../exercise-picker/usePick";
import { openGripEditor } from "../exercises/openExerciseEditor";
import { useAddToWorkout } from "../exercises/useAddToWorkout";
import { CategoryMark } from "../library/CategoryMark";
import { useLibrary } from "../library/useLibrary";
import { LockedPage } from "../components/LockedPage";
import { lockedRow, useLocks } from "../locks";
import { SummaryTiles } from "../summary/SummaryTiles";
import { TrendCard } from "../trends/TrendCard";
import { insight } from "@sendtally/features/hang";
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
  const usedIn = library.status === "ready" ? workoutsWithGrip(library.data.workouts, id) : [];

  const addTo = useAddToWorkout({
    name,
    pick: async () =>
      grip === undefined ? { exercise: id, kind: "hangboard" as const } : pickedOf({ grip }),
    fingers: true,
    usedIn,
  });
  const locks = useLocks();
  const locked = locks.create;
  const menu: DetailMenuRow[] =
    addTo.row === null || grip?.hidden === true
      ? []
      : [locked ? lockedRow(addTo.row, "exercise") : addTo.row];
  if (canCompareGrips(model.sessions))
    menu.push({
      icon: "insights",
      title: t("hang.compareGrips"),
      onPress: () => router.push("/grip/compare"),
    });
  if (grip !== undefined && !grip.hidden)
    menu.push(archiveGripRow(name, () => void actions.archiveGrip(grip)));

  if (grip !== undefined && locks.exercise({ grip })) return <LockedPage source="exercise" />;
  return (
    <ScreenFrame
      overlay={addTo.toast && <Toast {...addTo.toast} />}
      hero={libraryPictures("grip", id)}
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
          <Label color={colors.textSecondary}>{kindLabel("hangboard")}</Label>
        </View>
        <Title size={38}>{name}</Title>
        <Description text={gripDescription(id)} fold />
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
      {addTo.sheet && <AddToSheet {...addTo.sheet} />}
    </ScreenFrame>
  );
}
